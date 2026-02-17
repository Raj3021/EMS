import express from "express";
import { pool } from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply auth middleware to all chat routes
router.use(authMiddleware);

/**
 * GET /chat/unread-count
 * Fetch total unread message count for the user
 */
router.get("/unread-count", async (req, res) => {
  try {
    const { userId } = req.user;
    
    const result = await pool.query(
      `
      SELECT COUNT(*) as count
      FROM messages m
      JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE cp.user_id = $1
        AND m.sender_id != $1
        AND m.created_at > cp.last_read_at
      `,
      [userId]
    );

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ message: "Failed to fetch unread count" });
  }
});

/**
 * GET /chat/conversations
 * Fetch all conversations for the authenticated user
 */
router.get("/conversations", async (req, res) => {
  try {
    const { userId, tenantId } = req.user;

    const result = await pool.query(
      `
      SELECT 
        c.id,
        c.name,
        c.is_group,
        c.created_at,
        c.updated_at,
        -- Get other participant info (for 1-on-1 chats)
        (
          SELECT json_agg(
            json_build_object(
              'user_id', u.id,
              'first_name', e.first_name,
              'last_name', e.last_name,
              'email', u.email,
              'status', e.status
            )
          )
          FROM conversation_participants cp
          JOIN users u ON cp.user_id = u.id
          LEFT JOIN employees e ON e.user_id = u.id
          WHERE cp.conversation_id = c.id AND cp.user_id != $1
        ) as participants,
        -- Get last message
        (
          SELECT json_build_object(
            'content', m.content,
            'created_at', m.created_at,
            'sender_id', m.sender_id
          )
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as last_message,
        -- Count unread messages
        (
          SELECT COUNT(*)
          FROM messages m
          WHERE m.conversation_id = c.id
            AND m.sender_id != $1
            AND m.created_at > (
              SELECT last_read_at 
              FROM conversation_participants 
              WHERE conversation_id = c.id AND user_id = $1
            )
        ) as unread_count
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE cp.user_id = $1 AND c.tenant_id = $2
      ORDER BY c.updated_at DESC
      `,
      [userId, tenantId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
});

/**
 * GET /chat/conversations/:id
 * Fetch a single conversation with its details
 */
router.get("/conversations/:id", async (req, res) => {
  try {
    const { userId, tenantId } = req.user;
    const { id } = req.params;

    // Verify user is a participant
    const participantCheck = await pool.query(
      `SELECT 1 FROM conversation_participants 
       WHERE conversation_id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (participantCheck.rowCount === 0) {
      return res.status(403).json({ message: "Access denied" });
    }

    const result = await pool.query(
      `
      SELECT 
        c.id,
        c.name,
        c.is_group,
        c.created_at,
        c.updated_at,
        (
          SELECT json_agg(
            json_build_object(
              'user_id', u.id,
              'first_name', e.first_name,
              'last_name', e.last_name,
              'email', u.email,
              'status', e.status
            )
          )
          FROM conversation_participants cp
          JOIN users u ON cp.user_id = u.id
          LEFT JOIN employees e ON e.user_id = u.id
          WHERE cp.conversation_id = c.id
        ) as participants
      FROM conversations c
      WHERE c.id = $1 AND c.tenant_id = $2
      `,
      [id, tenantId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ message: "Failed to fetch conversation" });
  }
});

/**
 * POST /chat/conversations
 * Create a new conversation
 * Body: { participant_ids: [uuid], name?: string, is_group?: boolean }
 */
router.post("/conversations", async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId, tenantId } = req.user;
    const { participant_ids, name, is_group } = req.body;

    // console.log("Creating conversation:", { userId, tenantId, participant_ids, is_group });

    if (!participant_ids || !Array.isArray(participant_ids) || participant_ids.length === 0) {
      return res.status(400).json({ message: "participant_ids array is required" });
    }

    // Validate participant IDs are not null/undefined
    if (participant_ids.some(id => !id)) {
      console.error("Invalid participant ID detected:", participant_ids);
      return res.status(400).json({ message: "All participant IDs must be valid" });
    }

    // For 1-on-1 chats, check if conversation already exists
    if (!is_group && participant_ids.length === 1) {
      const otherUserId = participant_ids[0];
      
      // Prevent self-chat if strictly 1-on-1 (unless explicitly allowing self-notes?)
      // Use case: Chat with self is rare but possible. Standard is checking if other exists.
      
      const existingConv = await client.query(
        `
        SELECT c.id
        FROM conversations c
        WHERE c.is_group = false AND c.tenant_id = $1
          AND EXISTS (
            SELECT 1 FROM conversation_participants cp1
            WHERE cp1.conversation_id = c.id AND cp1.user_id = $2
          )
          AND EXISTS (
            SELECT 1 FROM conversation_participants cp2
            WHERE cp2.conversation_id = c.id AND cp2.user_id = $3
          )
          AND (
            SELECT COUNT(*) FROM conversation_participants cp3
            WHERE cp3.conversation_id = c.id
          ) = 2
        LIMIT 1
        `,
        [tenantId, userId, otherUserId]
      );

      if (existingConv.rowCount > 0) {
        // console.log("Found existing conversation:", existingConv.rows[0].id);
        return res.json({ 
          id: existingConv.rows[0].id,
          existing: true 
        });
      }
    }

    await client.query("BEGIN");

    // Create conversation
    const convQuery = `
      INSERT INTO conversations (tenant_id, name, is_group, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, is_group, created_at, updated_at
    `;
    const convValues = [tenantId, name || null, is_group || false, userId];
    // console.log("Executing conversation insert...");
    
    const convResult = await client.query(convQuery, convValues);
    const conversation = convResult.rows[0];
    const conversationId = conversation.id;

    // Add creator as participant
    await client.query(
      `
      INSERT INTO conversation_participants (conversation_id, user_id)
      VALUES ($1, $2)
      `,
      [conversationId, userId]
    );

    // Add other participants
    for (const participantId of participant_ids) {
      if (participantId !== userId) { // Avoid duplicate if creator is in list
        await client.query(
          `
          INSERT INTO conversation_participants (conversation_id, user_id)
          VALUES ($1, $2)
          ON CONFLICT (conversation_id, user_id) DO NOTHING
          `,
          [conversationId, participantId]
        );
      }
    }

    await client.query("COMMIT");
    // console.log("Conversation created successfully:", conversationId);

    // Fetch complete conversation details to return (including participants)
    // Just return the conversation object for now, cleaner
    res.status(201).json(conversation);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating conversation (POST /chat/conversations):", error);
    // Return detailed error in dev mode or generic
    res.status(500).json({ message: "Failed to create conversation", error: error.message });
  } finally {
    client.release();
  }
});

/**
 * GET /chat/messages/:conversationId
 * Fetch messages for a conversation with pagination
 * Query params: limit (default 50), offset (default 0)
 */
router.get("/messages/:conversationId", async (req, res) => {
  try {
    const { userId } = req.user;
    const { conversationId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    // Verify user is a participant
    const participantCheck = await pool.query(
      `SELECT 1 FROM conversation_participants 
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId]
    );

    if (participantCheck.rowCount === 0) {
      return res.status(403).json({ message: "Access denied" });
    }

    const result = await pool.query(
      `
      SELECT 
        m.id,
        m.conversation_id,
        m.sender_id,
        m.content,
        m.message_type,
        m.created_at,
        e.first_name as sender_first_name,
        e.last_name as sender_last_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      LEFT JOIN employees e ON e.user_id = u.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [conversationId, limit, offset]
    );

    // Reverse to show oldest first
    res.json(result.rows.reverse());
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

/**
 * POST /chat/messages
 * Send a new message
 * Body: { conversation_id: uuid, content: string, message_type?: string }
 */
router.post("/messages", async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId } = req.user;
    const { conversation_id, content, message_type } = req.body;

    if (!conversation_id || !content) {
      return res.status(400).json({ message: "conversation_id and content are required" });
    }

    // Verify user is a participant
    const participantCheck = await client.query(
      `SELECT 1 FROM conversation_participants 
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversation_id, userId]
    );

    if (participantCheck.rowCount === 0) {
      return res.status(403).json({ message: "Access denied" });
    }

    await client.query("BEGIN");

    // Insert message
    const messageResult = await client.query(
      `
      INSERT INTO messages (conversation_id, sender_id, content, message_type)
      VALUES ($1, $2, $3, $4)
      RETURNING id, conversation_id, sender_id, content, message_type, created_at
      `,
      [conversation_id, userId, content, message_type || "text"]
    );

    // Update conversation's updated_at timestamp
    await client.query(
      `UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [conversation_id]
    );

    await client.query("COMMIT");

    res.status(201).json(messageResult.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Failed to send message" });
  } finally {
    client.release();
  }
});

/**
 * PUT /chat/messages/:conversationId/read
 * Mark all messages in a conversation as read
 */
router.put("/messages/:conversationId/read", async (req, res) => {
  try {
    const { userId } = req.user;
    const { conversationId } = req.params;

    // Verify user is a participant
    const participantCheck = await pool.query(
      `SELECT 1 FROM conversation_participants 
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId]
    );

    if (participantCheck.rowCount === 0) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update last_read_at timestamp
    await pool.query(
      `
      UPDATE conversation_participants 
      SET last_read_at = CURRENT_TIMESTAMP 
      WHERE conversation_id = $1 AND user_id = $2
      `,
      [conversationId, userId]
    );

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ message: "Failed to mark messages as read" });
  }
});

export default router;
