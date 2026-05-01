import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * GET ALL PROJECTS
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.roles && req.user.roles.includes('admin');
    
    const result = await pool.query(
      `SELECT p.*,
        (SELECT json_agg(json_build_object('id', u.id, 'first_name', e.first_name, 'last_name', e.last_name))
         FROM project_team pt
         JOIN users u ON pt.user_id = u.id
         JOIN employees e ON u.id = e.user_id
         WHERE pt.project_id = p.id) as team,
        COALESCE(
          (SELECT ROUND(COUNT(*) FILTER (WHERE status = 'done') * 100.0 / NULLIF(COUNT(*), 0))
           FROM tasks t WHERE t.project_id = p.id), 
          0
        ) as progress
       FROM projects p
       WHERE p.tenant_id = $1
       AND (
         p.owner_id = $2 
         OR EXISTS (SELECT 1 FROM project_team pt WHERE pt.project_id = p.id AND pt.user_id = $2)
         OR $3 = TRUE
       )
       ORDER BY p.created_at DESC`,
      [req.user.tenantId, req.user.userId, isAdmin]
    );
    const formattedRows = result.rows.map(row => {
      if (row.deadline) {
        row.deadline = new Date(row.deadline.getTime() - (row.deadline.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      }
      return row;
    });
    res.json(formattedRows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * CREATE PROJECT
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, deadline, team_members } = req.body;

    const client = await pool.connect();
    
    try {
      await client.query("BEGIN");
      
      const result = await client.query(
        `INSERT INTO projects (tenant_id, name, deadline, owner_id)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [req.user.tenantId, name, deadline || null, req.user.userId]
      );
      
      const projectId = result.rows[0].id;
      
      // Add team members
      if (team_members && team_members.length > 0) {
        for (const userId of team_members) {
          await client.query(
            `INSERT INTO project_team (project_id, user_id) VALUES ($1, $2)`,
            [projectId, userId]
          );
        }
      }
      
      await client.query("COMMIT");
      res.status(201).json(result.rows[0]);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * UPDATE PROJECT
 */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { name, status, progress, deadline, team_members } = req.body;
    
    // Check ownership before updating
    const checkResult = await pool.query(
      `SELECT owner_id FROM projects WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, req.user.tenantId]
    );

    if (checkResult.rowCount === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isOwner = checkResult.rows[0].owner_id === req.user.userId;
    const isAdmin = req.user.roles && req.user.roles.includes('admin');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Only the project creator can edit this project." });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query("BEGIN");

      const result = await client.query(
        `UPDATE projects 
         SET name=$1, status=$2, progress=$3, deadline=$4
         WHERE id=$5 AND tenant_id=$6 
         RETURNING *`,
        [name, status, progress, deadline || null, req.params.id, req.user.tenantId]
      );

      // Re-link team members
      await client.query(`DELETE FROM project_team WHERE project_id = $1`, [req.params.id]);
      if (team_members && Array.isArray(team_members)) {
        for (const userId of team_members) {
          await client.query(
            `INSERT INTO project_team (project_id, user_id) VALUES ($1, $2)`,
            [req.params.id, userId]
          );
        }
      }

      await client.query("COMMIT");
      res.json(result.rows[0]);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * DELETE PROJECT
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    // Check ownership before deleting
    const checkResult = await pool.query(
      `SELECT owner_id FROM projects WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, req.user.tenantId]
    );

    if (checkResult.rowCount === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isOwner = checkResult.rows[0].owner_id === req.user.userId;
    const isAdmin = req.user.roles && req.user.roles.includes('admin');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Only the project creator can delete this project." });
    }

    const result = await pool.query(
      `DELETE FROM projects WHERE id = $1 AND tenant_id = $2 RETURNING id`,
      [req.params.id, req.user.tenantId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
