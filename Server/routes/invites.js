import express from "express";
import crypto from "crypto";
import { pool } from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";
import requirePermission from "../middleware/permissionMiddleware.js";

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
      const { firstName, lastName, email, roleId } = req.body;

      // ✅ Validation
      if (!firstName || !email || !roleId) {
        return res.status(400).json({
          error: "firstName, email, and roleId are required"
        });
      }

      const tenantId = req.user.tenantId;
      const invitedBy = req.user.userId;

      // Prevent duplicate invites/users
      const existing = await pool.query(
        `
        SELECT 1
        FROM users
        WHERE tenant_id = $1 AND email = $2
        `,
        [tenantId, email]
      );

      if (existing.rowCount > 0) {
        return res.status(409).json({
          error: "User with this email already exists"
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
          token,
          expires_at,
          invited_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          tenantId,
          email,
          firstName,
          lastName || null,
          roleId,
          token,
          expiresAt,
          invitedBy
        ]
      );

      // 4️⃣ Invite link
      const inviteLink = `http://localhost:3000/accept-invite?token=${token}`;

      return res.status(201).json({
        message: "Invite created successfully",
        inviteLink
      });

    } catch (error) {
      console.error("Invite error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
