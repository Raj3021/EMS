import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * GET ALL NOTES
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT * FROM notes 
      WHERE user_id = $1 AND tenant_id = $2
    `;
    const params = [req.user.userId, req.user.tenantId];

    if (search) {
      query += ` AND (title ILIKE $3 OR content ILIKE $3)`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY is_pinned DESC, updated_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET SINGLE NOTE
 */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notes WHERE id = $1 AND user_id = $2 AND tenant_id = $3`,
      [req.params.id, req.user.userId, req.user.tenantId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * CREATE NOTE
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, content, tags, linked_to, color, is_pinned } = req.body;

    const result = await pool.query(
      `INSERT INTO notes 
       (user_id, tenant_id, title, content, tags, linked_to, color, is_pinned)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.user.userId,
        req.user.tenantId,
        title,
        content,
        tags || [],
        linked_to,
        color || 'default',
        is_pinned || false
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * UPDATE NOTE
 */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { title, content, tags, linked_to, color, is_pinned } = req.body;

    const result = await pool.query(
      `UPDATE notes 
       SET title = $1, content = $2, tags = $3, linked_to = $4, 
           color = $5, is_pinned = $6, updated_at = NOW()
       WHERE id = $7 AND user_id = $8 AND tenant_id = $9
       RETURNING *`,
      [
        title,
        content,
        tags,
        linked_to,
        color,
        is_pinned,
        req.params.id,
        req.user.userId,
        req.user.tenantId
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * DELETE NOTE
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM notes 
       WHERE id = $1 AND user_id = $2 AND tenant_id = $3`,
      [req.params.id, req.user.userId, req.user.tenantId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json({ message: "Note deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
