import express from "express";
import crypto from "crypto";
import { pool } from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";
import requirePermission from "../middleware/permissionMiddleware.js";
import { sendInviteEmail } from "../services/emailService.js";

const router = express.Router();

/**
 * POST /invites
 * Admin creates an invite
 */
router.post(
  "/",
  authMiddleware,
  requirePermission("invite_user"),
  async (req, res) => {
    try {
      const { firstName, lastName, email, roleId, role, department } = req.body;

      // ✅ Validation
      if (!firstName || !email || (!roleId && !role)) {
        return res.status(400).json({
          error: "firstName, email, and role are required",
        });
      }

      const tenantId = req.user.tenantId;
      const invitedBy = req.user.userId;

      // Prevent duplicate users
      const existing = await pool.query(
        `
        SELECT 1
        FROM users
        WHERE tenant_id = $1 AND email = $2
        `,
        [tenantId, email],
      );

      if (existing.rowCount > 0) {
        return res.status(409).json({
          error: "User with this email already exists",
        });
      }

      // Prevent duplicate active invites
      const existingInvite = await pool.query(
        `
        SELECT 1
        FROM invites
        WHERE tenant_id = $1 AND email = $2
          AND accepted_at IS NULL
          AND expires_at > CURRENT_TIMESTAMP
        `,
        [tenantId, email],
      );

      if (existingInvite.rowCount > 0) {
        return res.status(409).json({
          error: "An active invite already exists for this email",
        });
      }

      const allowedRoles = ["manager", "employee"];
      let resolvedRoleId = roleId || null;
      let resolvedRoleName = role ? role.toLowerCase() : null;

      if (resolvedRoleId) {
        const roleResult = await pool.query(
          `
          SELECT id, name
          FROM roles
          WHERE id = $1 AND (tenant_id = $2 OR tenant_id IS NULL)
          `,
          [resolvedRoleId, tenantId],
        );

        if (roleResult.rowCount === 0) {
          return res.status(400).json({
            error: "Invalid roleId",
          });
        }

        resolvedRoleName = roleResult.rows[0].name;
      } else {
        const roleResult = await pool.query(
          `
          SELECT id, name
          FROM roles
          WHERE LOWER(name) = LOWER($1) AND (tenant_id = $2 OR tenant_id IS NULL)
          `,
          [resolvedRoleName, tenantId],
        );

        if (roleResult.rowCount === 0) {
          return res.status(400).json({
            error: "Invalid role. Use manager or employee.",
          });
        }

        resolvedRoleId = roleResult.rows[0].id;
        resolvedRoleName = roleResult.rows[0].name;
      }

      if (!allowedRoles.includes(resolvedRoleName.toLowerCase())) {
        return res.status(400).json({
          error: "Role must be manager or employee",
        });
      }

      if (resolvedRoleName.toLowerCase() === "employee" && !department) {
        return res.status(400).json({
          error: "department is required for employee role",
        });
      }

      // 1️⃣ Generate secure token
      const token = crypto.randomBytes(32).toString("hex");

      // 2️⃣ Expiry (48 hours)
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

      // 3️⃣ Store invite (NOW COMPLETE)
      await pool.query(
        `
        INSERT INTO invites (
          tenant_id,
          email,
          first_name,
          last_name,
          role_id,
          department,
          token,
          expires_at,
          invited_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          tenantId,
          email,
          firstName,
          lastName || null,
          resolvedRoleId,
          department || null,
          token,
          expiresAt,
          invitedBy,
        ],
      );

      // 4️⃣ Invite link
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
      const inviteLink = `${frontendUrl}/accept-invite?token=${token}`;

      await sendInviteEmail({
        to: email,
        firstName,
        inviteLink,
      });

      return res.status(201).json({
        message: "Invite created successfully",
        inviteLink,
      });
    } catch (error) {
      console.error("Invite error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * GET /invites
 * Get all pending invites
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, email, first_name, last_name, role_id, department, created_at, expires_at
      FROM invites
      WHERE tenant_id = $1 AND accepted_at IS NULL AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC
      `,
      [req.user.tenantId],
    );

    // Join with roles to get role names
    // Alternatively, we could do a JOIN in SQL
    const invites = result.rows;

    // Let's enhance with role names if role_id is present
    const invitesWithRoles = await Promise.all(
      invites.map(async (invite) => {
        if (!invite.role_id) return { ...invite, role_name: "Employee" };

        const roleRes = await pool.query(
          "SELECT name FROM roles WHERE id = $1",
          [invite.role_id],
        );
        return {
          ...invite,
          role_name: roleRes.rows[0]?.name || "Unknown",
        };
      }),
    );

    res.json(invitesWithRoles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * DELETE /invites/:id
 * Delete an invite
 */
router.delete("/:id", authMiddleware, requirePermission("invite_user"), async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const result = await pool.query(
      "DELETE FROM invites WHERE id = $1 AND tenant_id = $2 RETURNING *",
      [id, tenantId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Invite not found" });
    }

    res.json({ message: "Invite removed successfully" });
  } catch (error) {
    console.error("Delete invite error:", error);
    res.status(500).json({ error: "Server error" });
  }
});
  
export default router;
