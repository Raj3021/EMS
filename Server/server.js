import express from "express";
import dotenv from "dotenv";
import employeeRoutes from "./routes/employees.js";
import authRoutes from "./routes/auth.js";
import testRoutes from "./routes/test.js";
import inviteRoutes from "./routes/invites.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/test", testRoutes);
app.use("/employees", employeeRoutes);
app.use("/invites", inviteRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
