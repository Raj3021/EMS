import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/settings - Fetch user settings
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM user_settings WHERE user_id = $1`,
      [req.user.userId]
    );

    if (result.rowCount === 0) {
      // Return defaults if no settings exist
      return res.json({
        theme: "system",
        language: "en-US",
        notifications: {},
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/settings - Update user settings
router.put("/", authMiddleware, async (req, res) => {
  try {
    const { theme, language, notifications } = req.body;

    const result = await pool.query(
      `INSERT INTO user_settings (user_id, theme, language, notifications, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET
         theme = EXCLUDED.theme,
         language = EXCLUDED.language,
         notifications = EXCLUDED.notifications,
         updated_at = NOW()
       RETURNING *`,
      [req.user.userId, theme, language, notifications]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/settings/roles-stats - Fetch role statistics
router.get("/roles-stats", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.name, COUNT(ur.user_id) as user_count, 'Limited Access' as access_level
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      LEFT JOIN users u ON ur.user_id = u.id AND u.tenant_id = $1
      WHERE r.name IN ('admin', 'manager', 'employee')
      GROUP BY r.id, r.name
    `, [req.user.tenantId]);

    // Format the response to match the UI expectations or enhance it
    const stats = result.rows.map(row => ({
      role: row.name.charAt(0).toUpperCase() + row.name.slice(1), // Capitalize
      users: `${row.user_count} users`,
      permissions: row.name === 'admin' ? 'Full Access' : (row.name === 'manager' ? 'Limited Access' : 'Basic Access'),
      badgeColor: row.name === 'admin' ? 'success' : (row.name === 'manager' ? 'primary' : 'muted')
    }));

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
