import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login attempt:", { email, password });

    const tenant = await pool.query(
      "SELECT tenant_id FROM users WHERE email = $1",
      [email],
    );

    if (tenant.rowCount === 0) {
      console.log("Login failed: Email not found in users table");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Identify the correct tenant/user. If multiple, we might need logic, but for now take the first active one or just the first one.
    // Better approach: Find the user directly by email and verify password.
    // But since the current logic relies on tenant_id first... let's stick to it but maybe iterate?
    
    // Debugging: what did we find?
    // console.log("Found users with this email:", tenant.rows);

    const tenantDomain = tenant.rows[0].tenant_id;
    
    // 2. Find user within the tenant
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND is_active = true",
      [email.toLowerCase()],
    );

    if (userResult.rowCount === 0) {
      console.log("Login failed: User found in initial check but not found in active users query (status mismatch?)");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // There might be multiple users if multi-tenant. For now, let's try to match password against ANY of the found users.
    // If we find a match, use that user.
    
    let user = null;
    let isMatch = false;

    for (const u of userResult.rows) {
        const match = await bcrypt.compare(password, u.password_hash);
        if (match) {
            user = u;
            isMatch = true;
            break;
        }
    }

    if (!isMatch || !user) {
      console.log("Login failed: Password mismatch");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // If we found a valid user, update tenantId variable just in case
    const tenantId = user.tenant_id;

    // 5. Get roles
    const rolesResult = await pool.query(
      `SELECT r.name
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [user.id],
    );
    // console.log(rolesResult.rows);
    const roles = rolesResult.rows.map((r) => r.name);
    // console.log(roles[0]);

    // RESTRICTION REMOVED: Allow all valid users (Employees, Managers, etc.) to login.
    // if (!roles.includes("Admin")) {
    //   return res.status(403).json({ message: "Only admin can login" });
    // }

    const employeeResult = await pool.query(
      "SELECT first_name, last_name FROM employees WHERE user_id = $1",
      [user.id],
    );
    const employee = employeeResult.rows[0] || {};
    const firstName = employee.first_name || null;
    const lastName = employee.last_name || null;
    const name = [firstName, lastName].filter(Boolean).join(" ") || null;

    const tenantNameResult = await pool.query(
      "SELECT name FROM tenants WHERE id = $1",
      [user.tenant_id],
    );
    const tenantName = tenantNameResult.rows[0]?.name || null;

    // 6. Get permissions
    const permissionsResult = await pool.query(
      `SELECT DISTINCT p.name
       FROM user_roles ur
       JOIN role_permissions rp ON ur.role_id = rp.role_id
       JOIN permissions p ON rp.permission_id = p.id
       WHERE ur.user_id = $1`,
      [user.id],
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
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );

    // 8. Send response
    res.json({
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        roles,
        permissions,
        firstName,
        lastName,
        name,
        tenantName,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/accept-invite", async (req, res) => {
  const {
    token,
    password,
    confirmPassword,
    phone,
    designation,
    department,
    joiningDate,
  } = req.body;

  if (!token || !password || !confirmPassword) {
    return res.status(400).json({
      error: "Token, password, and confirmPassword are required",
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      error: "Passwords do not match",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: "Password must be at least 8 characters long",
    });
  }

  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // 1️⃣ Validate invite
    // 1️⃣ Validate invite - Check existence first for better error messages
    const inviteCheck = await client.query(
      "SELECT * FROM public.invites WHERE token = $1",
      [token]
    );

    if (inviteCheck.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Invalid invite link." });
    }

    const invite = inviteCheck.rows[0];

    if (invite.accepted_at) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "This invite has already been accepted." });
    }

    if (new Date(invite.expires_at) < new Date()) {
      await client.query("ROLLBACK");
      return res.status(410).json({ error: "This invite link has expired." });
    }
    
    // If we are here, invite is valid!
    // Continue with existing logic... but we already have 'invite' object.
    
    /* 
    const inviteResult = await client.query(
      `
      SELECT *
      FROM public.invites
      WHERE token = $1
        AND expires_at > CURRENT_TIMESTAMP
        AND accepted_at IS NULL
      `,
      [token],
    );

    if (inviteResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(401).json({
        error: "Invalid, expired, or already accepted invite",
      });
    }

    const invite = inviteResult.rows[0];
    */
    const {
      tenant_id,
      email,
      first_name,
      last_name,
      role_id,
      department: inviteDepartment,
    } = invite;

    // 2️⃣ Safety: check user does not already exist
    const existingUser = await client.query(
      `
      SELECT id
      FROM public.users
      WHERE tenant_id = $1 AND email = $2
      `,
      [tenant_id, email],
    );

    if (existingUser.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "User already exists for this tenant",
      });
    }

    // 3️⃣ Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // 4️⃣ Create user
    const userResult = await client.query(
      `
      INSERT INTO public.users (
        tenant_id,
        email,
        password_hash,
        is_email_verified,
        is_active
      )
      VALUES ($1, $2, $3, true, true)
      RETURNING id
      `,
      [tenant_id, email.toLowerCase(), password_hash],
    );

    const user_id = userResult.rows[0].id;

    // 5️⃣ Assign role
    if (role_id) {
      await client.query(
        `
        INSERT INTO public.user_roles (user_id, role_id)
        VALUES ($1, $2)
        `,
        [user_id, role_id],
      );
    }

    // 6️⃣ Create employee profile
    const employeeDepartment = department || inviteDepartment || null;
    await client.query(
      `
      INSERT INTO public.employees (
        tenant_id,
        user_id,
        first_name,
        last_name,
        email,
        phone,
        designation,
        department,
        joining_date,
        profile_completed
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
      `,
      [
        tenant_id,
        user_id,
        first_name,
        last_name,
        email,
        phone || null,
        designation || null,
        employeeDepartment,
        joiningDate || null,
      ],
    );

    // 7️⃣ Mark invite as accepted
    await client.query(
      `
      UPDATE public.invites
      SET accepted_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [invite.id],
    );

    await client.query("COMMIT");

    // 8️⃣ Response → frontend must redirect to complete-profile
    return res.status(200).json({
      message: "Password set successfully. Please complete your profile.",
      next: "COMPLETE_PROFILE",
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("Accept invite error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  } finally {
    if (client) client.release();
  }
});

export default router;
