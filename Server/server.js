import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import employeeRoutes from "./routes/employees.js";
import authRoutes from "./routes/auth.js";
import testRoutes from "./routes/test.js";
import inviteRoutes from "./routes/invites.js";
import settingsRoutes from "./routes/settings.js";
import chatRoutes from "./routes/chat.js";
// import chatRoutes from "./routes/chat.js";
import uploadRoutes from "./routes/upload.js";
import notesRoutes from "./routes/notes.js";
import fileRoutes from "./routes/files.js";

import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:8080"], // Allow both standard Vite and current user port
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(cors());

// Attach io to req for routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/auth", authRoutes);
app.use("/test", testRoutes);
app.use("/employees", employeeRoutes);
app.use("/invites", inviteRoutes);
app.use("/settings", settingsRoutes);
app.use("/chat", chatRoutes);
app.use("/upload", uploadRoutes);
app.use("/notes", notesRoutes);
app.use("/files", fileRoutes);

// app.use("/accept-invite", authRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// ============================================
// SOCKET.IO REAL-TIME CHAT
// ============================================

// Store online users: Map<userId, socketId>
const onlineUsers = new Map();

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user exists and is active
    const userResult = await pool.query(
      "SELECT id, tenant_id FROM users WHERE id = $1 AND is_active = true",
      [decoded.userId],
    );

    if (userResult.rowCount === 0) {
      return next(new Error("Authentication error: User not found"));
    }

    // Attach user info to socket
    socket.userId = decoded.userId;
    socket.tenantId = decoded.tenantId;

    next();
  } catch (error) {
    console.error("Socket auth error:", error);
    next(new Error("Authentication error"));
  }
});

// Socket.IO connection handler
io.on("connection", async (socket) => {
  const userId = socket.userId;
  console.log(`✅ User connected: ${userId}`);

  // Store user as online
  onlineUsers.set(userId, socket.id);

  // Get user's conversations and join rooms
  try {
    const conversations = await pool.query(
      `SELECT conversation_id FROM conversation_participants WHERE user_id = $1`,
      [userId],
    );

    conversations.rows.forEach((row) => {
      socket.join(`conversation:${row.conversation_id}`);
    });

    console.log(
      `User ${userId} joined ${conversations.rowCount} conversation rooms`,
    );
  } catch (error) {
    console.error("Error joining conversation rooms:", error);
  }

  // Broadcast user online status to their contacts
  io.emit("user_status", { userId, status: "online" });

  // Join a specific conversation room
  socket.on("join_conversation", async (conversationId) => {
    try {
      // Verify user is a participant
      const isParticipant = await pool.query(
        `SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2`,
        [conversationId, userId],
      );

      if (isParticipant.rowCount > 0) {
        socket.join(`conversation:${conversationId}`);
        console.log(`User ${userId} joined conversation ${conversationId}`);
      }
    } catch (error) {
      console.error("Error joining conversation:", error);
    }
  });

  // Send a message (real-time)
  socket.on("send_message", async (data) => {
    const { conversation_id, content, message_type = "text" } = data;

    try {
      // Verify user is a participant
      const isParticipant = await pool.query(
        `SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2`,
        [conversation_id, userId],
      );

      if (isParticipant.rowCount === 0) {
        socket.emit("error", { message: "Access denied" });
        return;
      }

      // Insert message into database
      const result = await pool.query(
        `INSERT INTO messages (conversation_id, sender_id, content, message_type)
         VALUES ($1, $2, $3, $4)
         RETURNING id, conversation_id, sender_id, content, message_type, created_at`,
        [conversation_id, userId, content, message_type],
      );

      // Update conversation timestamp
      await pool.query(
        `UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [conversation_id],
      );

      // Get sender info
      const senderInfo = await pool.query(
        `SELECT e.first_name, e.last_name 
         FROM employees e 
         WHERE e.user_id = $1`,
        [userId],
      );

      const message = {
        ...result.rows[0],
        sender_first_name: senderInfo.rows[0]?.first_name || null,
        sender_last_name: senderInfo.rows[0]?.last_name || null,
      };

      // Broadcast to all users in the conversation room
      io.to(`conversation:${conversation_id}`).emit("new_message", message);

      // Emit conversation update for sidebar
      io.to(`conversation:${conversation_id}`).emit("conversation_updated", {
        conversation_id,
        last_message: {
          content,
          created_at: message.created_at,
          sender_id: userId,
        },
        updated_at: new Date(),
      });
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Typing indicator
  socket.on("typing", (data) => {
    const { conversation_id } = data;
    socket.to(`conversation:${conversation_id}`).emit("user_typing", {
      conversation_id,
      userId,
    });
  });

  // Stop typing indicator
  socket.on("stop_typing", (data) => {
    const { conversation_id } = data;
    socket.to(`conversation:${conversation_id}`).emit("user_stop_typing", {
      conversation_id,
      userId,
    });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${userId}`);
    onlineUsers.delete(userId);

    // Broadcast user offline status
    io.emit("user_status", { userId, status: "offline" });
  });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.IO ready for real-time messaging`);
});
