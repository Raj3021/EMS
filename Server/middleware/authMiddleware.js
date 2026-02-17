import jwt from "jsonwebtoken";
import { pool } from "../db.js";

// Make middleware async
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Authorization header missing" });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ message: "Invalid authorization format" });
    }

    const token = parts[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user exists and is active
    const userResult = await pool.query(
      "SELECT id, tenant_id FROM users WHERE id = $1 AND is_active = true",
      [decoded.userId]
    );

    if (userResult.rowCount === 0) {
      return res.status(401).json({ message: "User not found or inactive" });
    }

    // You can update req.user with fresh data from DB if needed
    // Assuming decoded token hasroles/permissions, which is faster, but might be stale.
    // For now, let's keep using token data but just verify existence.
    
    req.user = {
      userId: decoded.userId,
      tenantId: decoded.tenantId, // Or userResult.rows[0].tenant_id
      roles: decoded.roles,
      permissions: decoded.permissions,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default authMiddleware;
