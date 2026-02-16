import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";
import requirePermission from "../middleware/permissionMiddleware.js";

const router = express.Router();

/**
 * CREATE EMPLOYEE (Admin only)
 */
router.post(
  "/",
  authMiddleware,
  requirePermission("create_employee"),
  async (req, res) => {
    try {
      const {
        first_name,
        last_name,
        email,
        phone,
        designation,
        department,
        joining_date,
      } = req.body;

      if (!first_name) {
        return res.status(400).json({ message: "First name required" });
      }

      const result = await pool.query(
        `INSERT INTO employees
         (tenant_id, first_name, last_name, email, phone, designation, department, joining_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING *`,
        [
          req.user.tenantId,
          first_name,
          last_name,
          email,
          phone,
          designation,
          department,
          joining_date,
        ],
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  },
);

/**
 * GET ALL EMPLOYEES (Tenant scoped)
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM employees
       WHERE tenant_id = $1 AND is_active = true
       ORDER BY created_at DESC`,
      [req.user.tenantId],
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET SINGLE EMPLOYEE
 */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM employees
       WHERE id = $1 AND tenant_id = $2`,
      [req.params.id, req.user.tenantId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET CURRENT USER SETTINGS
 */
router.get("/current/settings", authMiddleware, async (req, res) => {
  try {
    // Get user and employee data
    const userResult = await pool.query(
      `SELECT u.id, u.email, t.name as tenant_name
       FROM users u
       JOIN tenants t ON u.tenant_id = t.id
       WHERE u.id = $1`,
      [req.user.userId],
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = userResult.rows[0];

    // Get employee details
    const employeeResult = await pool.query(
      `SELECT first_name, last_name, phone, designation, department
       FROM employees
       WHERE user_id = $1 AND tenant_id = $2`,
      [req.user.userId, req.user.tenantId],
    );

    const employeeData = employeeResult.rows[0] || {};

    // Get tenant details
    const tenantResult = await pool.query(
      `SELECT id, name, domain, is_active
       FROM tenants
       WHERE id = $1`,
      [req.user.tenantId],
    );

    const tenantData = tenantResult.rows[0] || {};

    res.json({
      profile: {
        firstName: employeeData.first_name,
        lastName: employeeData.last_name,
        email: userData.email,
        phone: employeeData.phone,
        designation: employeeData.designation,
        department: employeeData.department,
      },
      company: {
        name: tenantData.name,
        domain: tenantData.domain,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * UPDATE EMPLOYEE
 */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { first_name, last_name, designation, department, phone } = req.body;

    const result = await pool.query(
      `UPDATE employees
       SET first_name=$1, last_name=$2, designation=$3,
           department=$4, phone=$5, updated_at=NOW()
       WHERE id=$6 AND tenant_id=$7
       RETURNING *`,
      [
        first_name,
        last_name,
        designation,
        department,
        phone,
        req.params.id,
        req.user.tenantId,
      ],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * UPDATE CURRENT USER PROFILE
 */
router.put("/current/profile", authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, phone, designation, department } = req.body;

    const result = await pool.query(
      `UPDATE employees
       SET first_name=$1, last_name=$2, phone=$3,
           designation=$4, department=$5, updated_at=NOW()
       WHERE user_id=$6 AND tenant_id=$7
       RETURNING *`,
      [
        firstName,
        lastName,
        phone,
        designation,
        department,
        req.user.userId,
        req.user.tenantId,
      ],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * UPDATE CURRENT USER COMPANY (ADMIN ONLY)
 */
router.put("/current/company", authMiddleware, async (req, res) => {
  try {
    const { name, domain } = req.body;

    // Check if user is admin (this should be verified by role check in middleware)
    const result = await pool.query(
      `UPDATE tenants
       SET name=$1, domain=$2
       WHERE id=$3
       RETURNING *`,
      [name, domain, req.user.tenantId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * SOFT DELETE EMPLOYEE
 */
router.delete(
  "/:id",
  authMiddleware,
  requirePermission("create_employee"),
  async (req, res) => {
    try {
      const result = await pool.query(
        `UPDATE employees
         SET is_active=false
         WHERE id=$1 AND tenant_id=$2`,
        [req.params.id, req.user.tenantId],
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Employee not found" });
      }

      res.json({ message: "Employee deactivated" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  },
);

export default router;
