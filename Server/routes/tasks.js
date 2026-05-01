import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * GET ALL TASKS
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { project_id } = req.query;
    
    let query = `
      SELECT t.*, 
        e.first_name as assignee_first_name, 
        e.last_name as assignee_last_name,
        p.name as project_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN employees e ON u.id = e.user_id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.tenant_id = $1
      AND (
         t.project_id IS NULL
         OR p.owner_id = $2
         OR EXISTS (SELECT 1 FROM project_team pt WHERE pt.project_id = t.project_id AND pt.user_id = $2)
         OR t.assignee_id = $2 
         OR $3 = TRUE
      )
    `;
    
    const isAdmin = req.user.roles && req.user.roles.includes('admin');
    const params = [req.user.tenantId, req.user.userId, isAdmin];
    
    if (project_id) {
      query += ` AND t.project_id = $2`;
      params.push(project_id);
    }
    
    query += ` ORDER BY t.created_at DESC`;

    const result = await pool.query(query, params);
    
    // Format response to match frontend expectation
    const formatted = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      project: row.project_name || "Unassigned",
      project_id: row.project_id,
      assignee: row.assignee_first_name ? `${row.assignee_first_name} ${row.assignee_last_name}` : "Unassigned",
      assignee_id: row.assignee_id,
      priority: row.priority,
      dueDate: row.due_date ? new Date(row.due_date.getTime() - (row.due_date.getTimezoneOffset() * 60000)).toISOString().split('T')[0] : null,
      status: row.status,
      description: row.description
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * CREATE TASK
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description, project_id, assignee_id, priority, status, due_date } = req.body;

    if (project_id) {
       const checkProject = await pool.query(
         `SELECT owner_id FROM projects WHERE id = $1 AND tenant_id = $2`,
         [project_id, req.user.tenantId]
       );
       if (checkProject.rowCount > 0) {
         const isOwner = checkProject.rows[0].owner_id === req.user.userId;
         const isAdmin = req.user.roles && req.user.roles.includes('admin');
         if (!isOwner && !isAdmin && assignee_id) {
           return res.status(403).json({ message: "Only the project creator can assign tasks to this project." });
         }
       }
    }

    const result = await pool.query(
      `INSERT INTO tasks (tenant_id, title, description, project_id, assignee_id, priority, status, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.tenantId, title, description, project_id || null, assignee_id || null, priority, status || 'todo', due_date || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * UPDATE TASK
 */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { title, description, project_id, assignee_id, priority, status, due_date } = req.body;
    
    // Check permissions
    const checkTask = await pool.query(
      `SELECT t.assignee_id, p.owner_id as project_owner_id 
       FROM tasks t 
       LEFT JOIN projects p ON t.project_id = p.id 
       WHERE t.id = $1 AND t.tenant_id = $2`,
      [req.params.id, req.user.tenantId]
    );

    if (checkTask.rowCount === 0) return res.status(404).json({ message: "Task not found" });

    const currentAssignee = checkTask.rows[0].assignee_id;
    const projectOwner = checkTask.rows[0].project_owner_id;
    
    const isOwner = projectOwner === req.user.userId;
    const isAdmin = req.user.roles && req.user.roles.includes('admin');

    if (projectOwner && !isOwner && !isAdmin) {
       if (currentAssignee !== req.user.userId) {
         return res.status(403).json({ message: "Only the task assignee can update its progress." });
       }
       
       // Explicitly only update the status if they are just the assignee
       const safeResult = await pool.query(
         `UPDATE tasks SET status=$1 WHERE id=$2 AND tenant_id=$3 RETURNING *`,
         [status, req.params.id, req.user.tenantId]
       );
       return res.json(safeResult.rows[0]);
    }

    const result = await pool.query(
      `UPDATE tasks 
       SET title=$1, description=$2, project_id=$3, assignee_id=$4, priority=$5, status=$6, due_date=$7
       WHERE id=$8 AND tenant_id=$9 
       RETURNING *`,
      [title, description, project_id || null, assignee_id || null, priority, status, due_date || null, req.params.id, req.user.tenantId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * DELETE TASK
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM tasks WHERE id = $1 AND tenant_id = $2 RETURNING id`,
      [req.params.id, req.user.tenantId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
