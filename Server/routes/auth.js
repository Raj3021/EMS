import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { pool } from "../db.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { tenantDomain, email, password } = req.body;

    // 1. Validate input
    if (!tenantDomain || !email || !password) {
      return res.status(400).json({ message: "Tenant domain, email, and password are required" });
    }

    // 2. Find tenant by domain
    const tenantResult = await pool.query(
      "SELECT id FROM tenants WHERE domain = $1 AND is_active = true",
      [tenantDomain]
    );

    if (tenantResult.rowCount === 0) {
      return res.status(401).json({ message: "Invalid tenant domain" });
    }

    const tenantId = tenantResult.rows[0].id;

    // 3. Find user within the tenant
    const userResult = await pool.query(
      "SELECT * FROM users WHERE tenant_id = $1 AND email = $2 AND is_active = true",
      [tenantId, email]
    );

    if (userResult.rowCount === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = userResult.rows[0];

    // 4. Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 5. Get roles
    const rolesResult = await pool.query(
      `SELECT r.name
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [user.id]
    );

    const roles = rolesResult.rows.map((r) => r.name);

    // 6. Get permissions
    const permissionsResult = await pool.query(
      `SELECT DISTINCT p.name
       FROM user_roles ur
       JOIN role_permissions rp ON ur.role_id = rp.role_id
       JOIN permissions p ON rp.permission_id = p.id
       WHERE ur.user_id = $1`,
      [user.id]
    );

    const permissions = permissionsResult.rows.map((p) => p.name);

    // 7. Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenant_id,
        roles,
        permissions,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // 8. Send response
    res.json({
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        roles,
        permissions,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/accept-invite", async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  // Basic validation (expand with Zod/Joi later)
  if (!token || !password || !confirmPassword) {
    return res.status(400).json({ error: "Token, password, and confirmPassword are required" });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }
  if (password.length < 8) { // Simple strength check; enhance as needed
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // Find the invite by token
    const inviteQuery = `
      SELECT * FROM public.invites
      WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP AND accepted_at IS NULL
    `;
    const inviteResult = await client.query(inviteQuery, [token]);

    if (inviteResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(401).json({ error: "Invalid, expired, or already used invite token" });
    }

    const invite = inviteResult.rows[0];
    const { tenant_id, email, role_id } = invite;

    // Check if user already exists (shouldn't, but safety)
    const userCheckQuery = `
      SELECT id FROM public.users
      WHERE tenant_id = $1 AND email = $2
    `;
    const userCheck = await client.query(userCheckQuery, [tenant_id, email]);
    if (userCheck.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "User with this email already exists in the tenant" });
    }

    // Hash the password
    const saltRounds = 12; // Adjust as needed for security/performance
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create the user
    const createUserQuery = `
      INSERT INTO public.users (tenant_id, email, password_hash, is_email_verified)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    const userResult = await client.query(createUserQuery, [tenant_id, email, password_hash, true]); // Assume verified via invite
    const user_id = userResult.rows[0].id;

    // Assign the role (if specified in invite)
    if (role_id) {
      const assignRoleQuery = `
        INSERT INTO public.user_roles (user_id, role_id)
        VALUES ($1, $2)
      `;
      await client.query(assignRoleQuery, [user_id, role_id]);
    }

    // Mark invite as accepted
    const updateInviteQuery = `
      UPDATE public.invites
      SET accepted_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await client.query(updateInviteQuery, [invite.id]);

    await client.query("COMMIT");
    res.status(200).json({ message: "Password set successfully. You can now log in." });

  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("Error accepting invite:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (client) client.release();
  }
});

export default router;
