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
      const { email, roleId } = req.body;
      console.log(email);
      console.log(roleId);
      if (!email || !roleId) {
        return res.status(400).json({ error: "Email and roleId are required" });
      }

      const tenantId = req.user.tenantId;
      const invitedBy = req.user.userId;

      // 1️⃣ Generate secure token
      const token = crypto.randomBytes(32).toString("hex");

      // 2️⃣ Set expiry (24 hours)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // 3️⃣ Store invite in DB
      await pool.query(
        `
        INSERT INTO invites
          (tenant_id, email, role_id, token, expires_at, invited_by)
        VALUES
          ($1, $2, $3, $4, $5, $6)
        `,
        [tenantId, email, roleId, token, expiresAt, invitedBy]
      );

      // 4️⃣ Build invite link (frontend URL later)
      const inviteLink = `http://localhost:3000/set-password?token=${token}`;

      return res.status(201).json({
        message: "Invite created successfully",
        inviteLink,
      });
    } catch (error) {
      console.error("Invite error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
