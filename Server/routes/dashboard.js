import express from "express";
import { pool } from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;

    const isAdmin = Array.isArray(req.user.roles) 
      ? req.user.roles.some(r => r.toLowerCase() === 'admin')
      : false;

    // Fetch Stats
    let activeProjectsCount = 0;
    let pendingTasksCount = 0;
    let completedTasksCount = 0;
    let pendingLeavesCount = 0;
    let totalEmployeesCount = 0;
    let tasksListResult;

    if (isAdmin) {
      // 1. Total Employees
      const employeesResult = await pool.query(
        `SELECT count(id) FROM employees WHERE tenant_id = $1 AND is_active = true`,
        [tenantId]
      );
      totalEmployeesCount = parseInt(employeesResult.rows[0].count, 10);

      // 2. All Active Projects
      const activeProjectsResult = await pool.query(
        `SELECT count(id) FROM projects WHERE tenant_id = $1 AND status = 'active'`,
        [tenantId]
      );
      activeProjectsCount = parseInt(activeProjectsResult.rows[0].count, 10);

      // 3. All Pending Tasks
      const pendingTasksResult = await pool.query(
        `SELECT count(id) FROM tasks WHERE tenant_id = $1 AND status != 'done'`,
        [tenantId]
      );
      pendingTasksCount = parseInt(pendingTasksResult.rows[0].count, 10);

      // 4. All Completed Tasks
      const completedTasksResult = await pool.query(
        `SELECT count(id) FROM tasks WHERE tenant_id = $1 AND status = 'done'`,
        [tenantId]
      );
      completedTasksCount = parseInt(completedTasksResult.rows[0].count, 10);

      // Fetch All Pending Tasks List
      tasksListResult = await pool.query(
        `SELECT t.id, t.title, p.name as project, t.priority, t.due_date as "dueDate", t.status, e.first_name || ' ' || e.last_name as assignee
         FROM tasks t
         LEFT JOIN projects p ON t.project_id = p.id
         LEFT JOIN employees e ON t.assignee_id = e.user_id
         WHERE t.tenant_id = $1 AND t.status != 'done'
         ORDER BY t.due_date ASC NULLS LAST
         LIMIT 5`,
        [tenantId]
      );
    } else {
      // For Employee:
      // 1. Total Active Projects (they are part of)
      const activeProjectsResult = await pool.query(
        `SELECT count(DISTINCT p.id) 
         FROM projects p
         JOIN project_team pt ON p.id = pt.project_id
         WHERE p.tenant_id = $1 AND pt.user_id = $2 AND p.status = 'active'`,
        [tenantId, userId]
      );
      activeProjectsCount = parseInt(activeProjectsResult.rows[0].count, 10);

      // 2. Pending Tasks (accessible to them)
      const pendingTasksResult = await pool.query(
        `SELECT count(t.id) 
         FROM tasks t
         LEFT JOIN projects p ON t.project_id = p.id
         WHERE t.tenant_id = $1 AND t.status != 'done'
         AND (
            t.project_id IS NULL
            OR p.owner_id = $2
            OR EXISTS (SELECT 1 FROM project_team pt WHERE pt.project_id = t.project_id AND pt.user_id = $2)
            OR t.assignee_id = $2
         )`,
        [tenantId, userId]
      );
      pendingTasksCount = parseInt(pendingTasksResult.rows[0].count, 10);

      // 3. Completed Tasks (accessible to them)
      const completedTasksResult = await pool.query(
        `SELECT count(t.id) 
         FROM tasks t
         LEFT JOIN projects p ON t.project_id = p.id
         WHERE t.tenant_id = $1 AND t.status = 'done'
         AND (
            t.project_id IS NULL
            OR p.owner_id = $2
            OR EXISTS (SELECT 1 FROM project_team pt WHERE pt.project_id = t.project_id AND pt.user_id = $2)
            OR t.assignee_id = $2
         )`,
        [tenantId, userId]
      );
      completedTasksCount = parseInt(completedTasksResult.rows[0].count, 10);

      // 4. Pending Leave Requests (for them)
      const pendingLeavesResult = await pool.query(
        `SELECT count(id) 
         FROM leave_requests 
         WHERE tenant_id = $1 AND user_id = $2 AND status = 'pending'`,
        [tenantId, userId]
      );
      pendingLeavesCount = parseInt(pendingLeavesResult.rows[0].count, 10);

      // Fetch Pending Tasks List
      tasksListResult = await pool.query(
        `SELECT t.id, t.title, p.name as project, t.priority, t.due_date as "dueDate", t.status, e.first_name || ' ' || e.last_name as assignee
         FROM tasks t
         LEFT JOIN projects p ON t.project_id = p.id
         LEFT JOIN employees e ON t.assignee_id = e.user_id
         WHERE t.tenant_id = $1 AND t.status != 'done'
         AND (
            t.project_id IS NULL
            OR p.owner_id = $2
            OR EXISTS (SELECT 1 FROM project_team pt WHERE pt.project_id = t.project_id AND pt.user_id = $2)
            OR t.assignee_id = $2
         )
         ORDER BY t.due_date ASC NULLS LAST
         LIMIT 5`,
        [tenantId, userId]
      );
    }

    // Fetch Upcoming Meetings (Graceful fallback if table doesn't exist)
    let upcomingMeetings = [];
    try {
        const meetingsResult = await pool.query(
            `SELECT m.id, m.title, m.date, m.time, 
            (SELECT count(*) FROM meeting_participants mp WHERE mp.meeting_id = m.id) as attendees
            FROM meetings m
            JOIN meeting_participants mp ON m.id = mp.meeting_id
            WHERE m.tenant_id = $1 AND mp.user_id = $2 AND m.date >= CURRENT_DATE
            ORDER BY m.date ASC, m.time ASC
            LIMIT 3`,
            [tenantId, userId]
        );
        upcomingMeetings = meetingsResult.rows.map(m => ({
            id: m.id,
            title: m.title,
            date: m.date ? m.date.toISOString().split('T')[0] : '',
            time: m.time,
            attendees: parseInt(m.attendees, 10)
        }));
    } catch (e) {
        // Table might not exist yet, ignoring error safely
    }

    res.json({
      stats: {
        totalEmployees: totalEmployeesCount,
        pendingLeaves: pendingLeavesCount,
        activeProjects: activeProjectsCount,
        upcomingMeetingsCount: upcomingMeetings.length,
        pendingTasks: pendingTasksCount,
        completedTasks: completedTasksCount,
      },
      pendingTasks: tasksListResult.rows,
      upcomingMeetings: upcomingMeetings,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Server error fetching dashboard data" });
  }
});

export default router;
