import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Helper to check roles
 */
const hasRole = (user, role) => {
  const roles = Array.isArray(user?.roles) ? user.roles : user?.role ? [user.role] : [];
  return roles.some(r => r?.toLowerCase() === role.toLowerCase());
};

/**
 * GET /types
 * Get all leave types
 */
router.get("/types", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM leave_types WHERE tenant_id = $1 AND is_active = true ORDER BY name`,
      [req.user.tenantId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /types
 * Create a new leave type (Admin only)
 */
router.post("/types", authMiddleware, async (req, res) => {
  try {
    if (!hasRole(req.user, 'admin')) {
      return res.status(403).json({ message: "Only admins can create leave types" });
    }

    const { name, description, default_days } = req.body;
    const result = await pool.query(
      `INSERT INTO leave_types (tenant_id, name, description, default_days)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.tenantId, name, description, default_days || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /balances
 * Get leave balances based on role
 */
router.get("/balances", authMiddleware, async (req, res) => {
  try {
    const isAdmin = hasRole(req.user, 'admin');
    const isManager = hasRole(req.user, 'manager');

    let query = `
      SELECT lb.id, lb.tenant_id, lb.user_id, lb.leave_type_id, lb.total_days, lb.year,
             lt.name as leave_type_name, 
             e.first_name, e.last_name, e.department,
             COALESCE((
                 SELECT SUM(lr.total_days) 
                 FROM leave_requests lr 
                 WHERE lr.user_id = lb.user_id 
                   AND lr.leave_type_id = lb.leave_type_id 
                   AND lr.status IN ('approved', 'pending') 
                   AND EXTRACT(YEAR FROM lr.start_date) = lb.year
             ), 0) as used_days,
             (lb.total_days - COALESCE((
                 SELECT SUM(lr.total_days) 
                 FROM leave_requests lr 
                 WHERE lr.user_id = lb.user_id 
                   AND lr.leave_type_id = lb.leave_type_id 
                   AND lr.status IN ('approved', 'pending') 
                   AND EXTRACT(YEAR FROM lr.start_date) = lb.year
             ), 0)) as remaining_days
      FROM leave_balances lb
      JOIN leave_types lt ON lb.leave_type_id = lt.id
      JOIN employees e ON lb.user_id = e.user_id
      WHERE lb.tenant_id = $1 AND lb.year = EXTRACT(YEAR FROM CURRENT_DATE)
    `;
    
    const params = [req.user.tenantId];

    if (!isAdmin && !isManager) {
      // Employee sees only their own
      query += ` AND lb.user_id = $2`;
      params.push(req.user.userId);
    } 
    // If manager, they can see everyone (or we could restrict to non-admins, but for now they see all so they can manage their team)
    
    query += ` ORDER BY e.first_name, lt.name`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /balances
 * Assign leave balance to an employee (Admin only)
 */
router.post("/balances", authMiddleware, async (req, res) => {
  try {
    if (!hasRole(req.user, 'admin')) {
      return res.status(403).json({ message: "Only admins can assign leave balances" });
    }

    const { target_role, leave_type_id, total_days } = req.body;
    
    // Find all users with the target role
    const usersWithRole = await pool.query(
      `SELECT ur.user_id 
       FROM user_roles ur 
       JOIN roles r ON ur.role_id = r.id 
       JOIN users u ON ur.user_id = u.id
       WHERE u.tenant_id = $1 AND LOWER(r.name) = LOWER($2)`,
      [req.user.tenantId, target_role]
    );

    if (usersWithRole.rowCount === 0) {
      return res.status(404).json({ message: `No users found with role: ${target_role}` });
    }

    // Upsert leave_balances for all these users
    for (const row of usersWithRole.rows) {
      const target_user_id = row.user_id;
      const existing = await pool.query(
        `SELECT * FROM leave_balances WHERE tenant_id = $1 AND user_id = $2 AND leave_type_id = $3 AND year = EXTRACT(YEAR FROM CURRENT_DATE)`,
        [req.user.tenantId, target_user_id, leave_type_id]
      );

      if (existing.rowCount > 0) {
        const current = existing.rows[0];
        const used = parseFloat(current.used_days);
        const remaining = parseFloat(total_days) - used;
        
        await pool.query(
          `UPDATE leave_balances SET total_days = $1, remaining_days = $2, updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [total_days, remaining, current.id]
        );
      } else {
        await pool.query(
          `INSERT INTO leave_balances (tenant_id, user_id, leave_type_id, total_days, remaining_days)
           VALUES ($1, $2, $3, $4, $4)`,
          [req.user.tenantId, target_user_id, leave_type_id, total_days]
        );
      }
    }
    
    return res.json({ message: `Balances updated for ${usersWithRole.rowCount} users.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /requests
 * Get leave requests based on role
 */
router.get("/requests", authMiddleware, async (req, res) => {
  try {
    const isAdmin = hasRole(req.user, 'admin');
    const isManager = hasRole(req.user, 'manager');

    let query = `
      SELECT lr.*, lt.name as leave_type_name, 
             e.first_name, e.last_name, e.department,
             r.first_name as reviewer_first_name, r.last_name as reviewer_last_name
      FROM leave_requests lr
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      JOIN employees e ON lr.user_id = e.user_id
      LEFT JOIN employees r ON lr.reviewed_by = r.user_id
      WHERE lr.tenant_id = $1
    `;
    
    const params = [req.user.tenantId];

    if (!isAdmin && !isManager) {
      // Employee sees only their own
      query += ` AND lr.user_id = $2`;
      params.push(req.user.userId);
    }
    
    query += ` ORDER BY lr.created_at DESC`;

    const result = await pool.query(query, params);
    
    // Formatting response to match usual date expectations
    const formatted = result.rows.map(row => {
      const start = new Date(row.start_date);
      const end = new Date(row.end_date);
      return {
        ...row,
        start_date: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`,
        end_date: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /requests
 * Apply for leave
 */
router.post("/requests", authMiddleware, async (req, res) => {
  try {
    const { leave_type_id, start_date, end_date, total_days, reason, attachment_url } = req.body;

    // Check for overlapping leaves
    const overlapCheck = await pool.query(
      `SELECT id FROM leave_requests 
       WHERE tenant_id = $1 AND user_id = $2 
       AND status IN ('pending', 'approved')
       AND (start_date <= $4 AND end_date >= $3)`,
      [req.user.tenantId, req.user.userId, start_date, end_date]
    );

    if (overlapCheck.rowCount > 0) {
      return res.status(400).json({ message: "You already have a pending or approved leave request that overlaps with these dates." });
    }

    // First check if balance is sufficient
    const balanceResult = await pool.query(
      `SELECT lb.total_days,
              (lb.total_days - COALESCE((
                 SELECT SUM(lr.total_days) 
                 FROM leave_requests lr 
                 WHERE lr.user_id = lb.user_id 
                   AND lr.leave_type_id = lb.leave_type_id 
                   AND lr.status IN ('approved', 'pending') 
                   AND EXTRACT(YEAR FROM lr.start_date) = lb.year
             ), 0)) as remaining_days
       FROM leave_balances lb
       WHERE lb.tenant_id = $1 AND lb.user_id = $2 AND lb.leave_type_id = $3 AND lb.year = EXTRACT(YEAR FROM CURRENT_DATE)`,
      [req.user.tenantId, req.user.userId, leave_type_id]
    );

    if (balanceResult.rowCount === 0) {
      return res.status(400).json({ message: "No leave balance found for this leave type. Please contact HR/Admin." });
    }

    const balance = balanceResult.rows[0];
    if (parseFloat(balance.remaining_days) < parseFloat(total_days)) {
      return res.status(400).json({ message: `Insufficient leave balance. You only have ${balance.remaining_days} days left.` });
    }

    // Insert request
    const result = await pool.query(
      `INSERT INTO leave_requests (tenant_id, user_id, leave_type_id, start_date, end_date, total_days, reason, attachment_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending') RETURNING *`,
      [req.user.tenantId, req.user.userId, leave_type_id, start_date, end_date, total_days, reason, attachment_url || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * PUT /requests/:id/status
 * Approve or Reject a leave request
 */
router.put("/requests/:id/status", authMiddleware, async (req, res) => {
  try {
    const isAdmin = hasRole(req.user, 'admin');
    const isManager = hasRole(req.user, 'manager');

    if (!isAdmin && !isManager) {
      return res.status(403).json({ message: "Unauthorized to update leave status" });
    }

    const { status, rejection_reason } = req.body; // 'approved' or 'rejected'
    const requestId = req.params.id;

    // Get the request to check who requested it
    const requestResult = await pool.query(
      `SELECT lr.*, 
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = lr.user_id AND r.name = 'manager') as is_requester_manager,
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = lr.user_id AND r.name = 'admin') as is_requester_admin
       FROM leave_requests lr WHERE lr.id = $1 AND lr.tenant_id = $2`,
      [requestId, req.user.tenantId]
    );

    if (requestResult.rowCount === 0) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    const leaveRequest = requestResult.rows[0];

    // Business Logic: Only Admin can approve Manager's or Admin's leaves
    if (parseInt(leaveRequest.is_requester_manager) > 0 || parseInt(leaveRequest.is_requester_admin) > 0) {
      if (!isAdmin) {
        return res.status(403).json({ message: "Only Admins can approve leaves for Managers." });
      }
    }

    // Begin transaction
    await pool.query('BEGIN');

    // Update status
    const updateResult = await pool.query(
      `UPDATE leave_requests 
       SET status = $1, reviewed_by = $2, rejection_reason = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [status, req.user.userId, status === 'rejected' ? rejection_reason : null, requestId]
    );

    // We compute balances dynamically, so no need to update leave_balances table manually here.

    await pool.query('COMMIT');

    res.json(updateResult.rows[0]);
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * PUT /requests/:id/cancel
 * Cancel a pending leave request (by requester)
 */
router.put("/requests/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const requestId = req.params.id;

    const requestResult = await pool.query(
      `SELECT * FROM leave_requests WHERE id = $1 AND tenant_id = $2`,
      [requestId, req.user.tenantId]
    );

    if (requestResult.rowCount === 0) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    const leaveRequest = requestResult.rows[0];

    if (leaveRequest.user_id !== req.user.userId) {
      return res.status(403).json({ message: "You can only cancel your own leave requests." });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({ message: "Only pending requests can be cancelled." });
    }

    const updateResult = await pool.query(
      `UPDATE leave_requests SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [requestId]
    );

    res.json(updateResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
