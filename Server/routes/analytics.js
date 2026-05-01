import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const isAdmin = Array.isArray(req.user.roles) 
      ? req.user.roles.some(r => r.toLowerCase() === 'admin')
      : false;

    if (!isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const days = parseInt(req.query.days) || 30;
    
    // Postgres interval syntax
    const intervalStr = `${days} days`;

    // 1. Stats Grid
    // Tasks Completed in timeframe
    const tasksCompletedRes = await pool.query(
      `SELECT count(id) FROM tasks 
       WHERE tenant_id = $1 AND status = 'done' 
       AND created_at >= NOW() - ($2 || ' days')::interval`,
      [tenantId, days]
    );
    const tasksCompleted = parseInt(tasksCompletedRes.rows[0].count, 10);

    // Active Projects (currently)
    const activeProjectsRes = await pool.query(
      `SELECT count(id) FROM projects WHERE tenant_id = $1 AND status = 'active'`,
      [tenantId]
    );
    const activeProjects = parseInt(activeProjectsRes.rows[0].count, 10);

    // Total Tasks in timeframe (for productivity)
    const totalTasksRes = await pool.query(
      `SELECT count(id) FROM tasks 
       WHERE tenant_id = $1 AND created_at >= NOW() - ($2 || ' days')::interval`,
      [tenantId, days]
    );
    const totalTasks = parseInt(totalTasksRes.rows[0].count, 10);
    const productivityPercentage = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

    // Team Growth (New hires in timeframe)
    const teamGrowthRes = await pool.query(
      `SELECT count(id) FROM employees 
       WHERE tenant_id = $1 AND created_at >= NOW() - ($2 || ' days')::interval`,
      [tenantId, days]
    );
    const teamGrowth = parseInt(teamGrowthRes.rows[0].count, 10);

    // 2. Trend Charts
    // Tasks Completed vs Pending trend (grouped by date)
    const tasksTrendRes = await pool.query(
      `SELECT 
         created_at::date as date,
         COUNT(CASE WHEN status = 'done' THEN 1 END) as completed,
         COUNT(CASE WHEN status != 'done' THEN 1 END) as pending
       FROM tasks
       WHERE tenant_id = $1 AND created_at >= NOW() - ($2 || ' days')::interval
       GROUP BY created_at::date
       ORDER BY created_at::date ASC`,
      [tenantId, days]
    );
    
    // New hires vs exits trend (monthly or daily, let's do daily grouped for simplicity, UI can adapt)
    const hiresTrendRes = await pool.query(
      `SELECT 
         created_at::date as date,
         COUNT(id) as hires
       FROM employees
       WHERE tenant_id = $1 AND created_at >= NOW() - ($2 || ' days')::interval
       GROUP BY created_at::date
       ORDER BY created_at::date ASC`,
      [tenantId, days]
    );

    // 3. Project Progress & Tasks per project
    // Compute progress dynamically from done/total tasks ratio
    const projectProgressRes = await pool.query(
      `SELECT 
         p.name,
         p.progress as stored_progress,
         COUNT(t.id) as tasks_count,
         COUNT(CASE WHEN t.status = 'done' THEN 1 END) as done_tasks
       FROM projects p
       LEFT JOIN tasks t ON p.id = t.project_id
       WHERE p.tenant_id = $1 AND p.status = 'active'
       GROUP BY p.id, p.name, p.progress
       ORDER BY p.name ASC
       LIMIT 6`,
      [tenantId]
    );

    // 4. Top Performers (Employees with most completed tasks in timeframe)
    const topPerformersRes = await pool.query(
      `SELECT e.first_name, e.last_name, e.department as role, count(t.id) as completed_tasks
       FROM employees e
       JOIN tasks t ON e.user_id = t.assignee_id
       WHERE e.tenant_id = $1 AND t.status = 'done' AND t.created_at >= NOW() - ($2 || ' days')::interval
       GROUP BY e.id, e.first_name, e.last_name, e.department
       ORDER BY completed_tasks DESC
       LIMIT 4`,
      [tenantId, days]
    );

    // 5. Employees missing deadlines
    const missingDeadlinesRes = await pool.query(
      `SELECT e.first_name, e.last_name, count(t.id) as missed_tasks
       FROM employees e
       JOIN tasks t ON e.user_id = t.assignee_id
       WHERE e.tenant_id = $1 AND t.status != 'done' AND t.due_date < CURRENT_DATE
       GROUP BY e.id, e.first_name, e.last_name
       ORDER BY missed_tasks DESC
       LIMIT 5`,
      [tenantId]
    );

    // 6. Pie chart of employees in department
    const departmentsRes = await pool.query(
      `SELECT COALESCE(department, 'Unassigned') as name, count(id) as value
       FROM employees
       WHERE tenant_id = $1 AND is_active = true
       GROUP BY department`,
      [tenantId]
    );

    res.json({
      stats: {
        productivity: productivityPercentage,
        tasksCompleted,
        activeProjects,
        teamGrowth
      },
      tasksTrend: tasksTrendRes.rows.map(r => ({
        date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completed: parseInt(r.completed, 10),
        pending: parseInt(r.pending, 10)
      })),
      hiresTrend: hiresTrendRes.rows.map(r => ({
        date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        hires: parseInt(r.hires, 10),
        exits: 0 // Mock exits for now if there is no exit tracking yet
      })),
      projectProgress: projectProgressRes.rows.map(r => {
        const total = parseInt(r.tasks_count, 10);
        const done = parseInt(r.done_tasks, 10);
        // Compute real progress from tasks; fall back to stored value if no tasks
        const computedProgress = total > 0 ? Math.round((done / total) * 100) : parseInt(r.stored_progress, 10) || 0;
        return {
          name: r.name,
          progress: computedProgress,
          tasksCount: total,
          doneTasks: done,
        };
      }),
      topPerformers: topPerformersRes.rows.map(r => ({
        name: `${r.first_name} ${r.last_name}`,
        role: r.role || 'Employee',
        tasks: parseInt(r.completed_tasks, 10),
        score: Math.min(100, 70 + parseInt(r.completed_tasks, 10) * 2) // mock score computation
      })),
      missingDeadlines: missingDeadlinesRes.rows.map(r => ({
        name: `${r.first_name} ${r.last_name}`,
        missed: parseInt(r.missed_tasks, 10)
      })),
      departments: departmentsRes.rows.map(r => ({
        name: r.name,
        value: parseInt(r.value, 10)
      }))
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ message: "Server error fetching analytics" });
  }
});

export default router;
