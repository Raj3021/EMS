import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Shared attendee join fragment
const ATTENDEES_SUBQUERY = `
  COALESCE(
    json_agg(
      json_build_object(
        'user_id',     ma.user_id,
        'first_name',  e.first_name,
        'last_name',   e.last_name,
        'department',  e.department,
        'rsvp_status', ma.rsvp_status
      )
    ) FILTER (WHERE ma.user_id IS NOT NULL),
    '[]'
  ) AS attendees
`;

// ─── GET /meetings  ───────────────────────────────────────────────────────────
// Returns all meetings for the tenant with attendee list
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const { from, to } = req.query; // optional ISO date filters

    let dateFilter = "";
    const params = [tenantId];

    if (from) {
      params.push(from);
      dateFilter += ` AND m.start_time >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      dateFilter += ` AND m.start_time <= $${params.length}`;
    }

    const result = await pool.query(
      `SELECT
         m.*,
         e_creator.first_name AS creator_first_name,
         e_creator.last_name  AS creator_last_name,
         ${ATTENDEES_SUBQUERY}
       FROM meetings m
       LEFT JOIN employees e_creator ON e_creator.user_id = m.created_by AND e_creator.tenant_id = m.tenant_id
       LEFT JOIN meeting_attendees ma ON ma.meeting_id = m.id
       LEFT JOIN employees e ON e.user_id = ma.user_id AND e.tenant_id = m.tenant_id
       WHERE m.tenant_id = $1 ${dateFilter}
       GROUP BY m.id, e_creator.first_name, e_creator.last_name
       ORDER BY m.start_time ASC`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET /meetings error:", err);
    res.status(500).json({ message: "Failed to fetch meetings" });
  }
});

// ─── GET /meetings/:id ────────────────────────────────────────────────────────
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
         m.*,
         e_creator.first_name AS creator_first_name,
         e_creator.last_name  AS creator_last_name,
         ${ATTENDEES_SUBQUERY}
       FROM meetings m
       LEFT JOIN employees e_creator ON e_creator.user_id = m.created_by AND e_creator.tenant_id = m.tenant_id
       LEFT JOIN meeting_attendees ma ON ma.meeting_id = m.id
       LEFT JOIN employees e ON e.user_id = ma.user_id AND e.tenant_id = m.tenant_id
       WHERE m.id = $1 AND m.tenant_id = $2
       GROUP BY m.id, e_creator.first_name, e_creator.last_name`,
      [id, tenantId]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ message: "Meeting not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET /meetings/:id error:", err);
    res.status(500).json({ message: "Failed to fetch meeting" });
  }
});

// ─── POST /meetings ───────────────────────────────────────────────────────────
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const {
      title,
      description,
      location,
      meeting_type = "scheduled",
      start_time,
      end_time,
      attendee_ids = [], // array of user_ids
    } = req.body;

    if (!title || !start_time || !end_time)
      return res.status(400).json({ message: "title, start_time, end_time are required" });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Insert meeting
      const meetingRes = await client.query(
        `INSERT INTO meetings (tenant_id, created_by, title, description, location, meeting_type, start_time, end_time)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [tenantId, userId, title, description, location, meeting_type, start_time, end_time]
      );
      const meeting = meetingRes.rows[0];

      // Ensure organizer is always an attendee (accepted)
      const allAttendees = [...new Set([userId, ...attendee_ids])];

      if (allAttendees.length > 0) {
        const values = allAttendees
          .map((uid, i) => `($1, $${i + 2}, $${allAttendees.length + 2})`)
          .join(", ");
        // organizer is auto-accepted; others are pending
        const statuses = allAttendees.map((uid) =>
          uid === userId ? "accepted" : "pending"
        );
        // Build parameterized insert for attendees
        for (const uid of allAttendees) {
          const status = uid === userId ? "accepted" : "pending";
          await client.query(
            `INSERT INTO meeting_attendees (meeting_id, user_id, rsvp_status)
             VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
            [meeting.id, uid, status]
          );
        }
      }

      await client.query("COMMIT");

      // Re-fetch with attendees joined
      const full = await pool.query(
        `SELECT
           m.*,
           e_creator.first_name AS creator_first_name,
           e_creator.last_name  AS creator_last_name,
           ${ATTENDEES_SUBQUERY}
         FROM meetings m
         LEFT JOIN employees e_creator ON e_creator.user_id = m.created_by AND e_creator.tenant_id = m.tenant_id
         LEFT JOIN meeting_attendees ma ON ma.meeting_id = m.id
         LEFT JOIN employees e ON e.user_id = ma.user_id AND e.tenant_id = m.tenant_id
         WHERE m.id = $1
         GROUP BY m.id, e_creator.first_name, e_creator.last_name`,
        [meeting.id]
      );

      const fullMeeting = full.rows[0];

      // ── Real-time: notify each attendee (except organizer)
      const io = req.io;
      if (io) {
        for (const uid of attendee_ids) {
          if (uid !== userId) {
            io.to(`user:${uid}`).emit("meeting_invite", {
              meeting: fullMeeting,
              message: `You've been invited to "${title}"`,
            });
          }
        }
      }

      res.status(201).json(fullMeeting);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("POST /meetings error:", err);
    res.status(500).json({ message: "Failed to create meeting" });
  }
});

// ─── PUT /meetings/:id ────────────────────────────────────────────────────────
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const { id } = req.params;
    const { title, description, location, meeting_type, start_time, end_time, status, attendee_ids } = req.body;

    // Only the creator or admin can edit
    const existing = await pool.query(
      `SELECT * FROM meetings WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    if (existing.rowCount === 0)
      return res.status(404).json({ message: "Meeting not found" });

    const isAdmin = Array.isArray(req.user.roles) &&
      req.user.roles.some((r) => r.toLowerCase() === "admin");

    if (existing.rows[0].created_by !== userId && !isAdmin)
      return res.status(403).json({ message: "Only the organizer can edit this meeting" });

    await pool.query(
      `UPDATE meetings
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           location = COALESCE($3, location),
           meeting_type = COALESCE($4, meeting_type),
           start_time = COALESCE($5, start_time),
           end_time = COALESCE($6, end_time),
           status = COALESCE($7, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND tenant_id = $9`,
      [title, description, location, meeting_type, start_time, end_time, status, id, tenantId]
    );

    // Update attendees if provided
    if (Array.isArray(attendee_ids)) {
      await pool.query(`DELETE FROM meeting_attendees WHERE meeting_id = $1`, [id]);
      const allAttendees = [...new Set([userId, ...attendee_ids])];
      for (const uid of allAttendees) {
        const rsvp = uid === userId ? "accepted" : "pending";
        await pool.query(
          `INSERT INTO meeting_attendees (meeting_id, user_id, rsvp_status)
           VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [id, uid, rsvp]
        );
      }
    }

    const full = await pool.query(
      `SELECT m.*, e_creator.first_name AS creator_first_name, e_creator.last_name AS creator_last_name,
         ${ATTENDEES_SUBQUERY}
       FROM meetings m
       LEFT JOIN employees e_creator ON e_creator.user_id = m.created_by AND e_creator.tenant_id = m.tenant_id
       LEFT JOIN meeting_attendees ma ON ma.meeting_id = m.id
       LEFT JOIN employees e ON e.user_id = ma.user_id AND e.tenant_id = m.tenant_id
       WHERE m.id = $1 GROUP BY m.id, e_creator.first_name, e_creator.last_name`,
      [id]
    );

    res.json(full.rows[0]);
  } catch (err) {
    console.error("PUT /meetings/:id error:", err);
    res.status(500).json({ message: "Failed to update meeting" });
  }
});

// ─── DELETE /meetings/:id ─────────────────────────────────────────────────────
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const { id } = req.params;

    const existing = await pool.query(
      `SELECT * FROM meetings WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    if (existing.rowCount === 0)
      return res.status(404).json({ message: "Meeting not found" });

    const isAdmin = Array.isArray(req.user.roles) &&
      req.user.roles.some((r) => r.toLowerCase() === "admin");

    if (existing.rows[0].created_by !== userId && !isAdmin)
      return res.status(403).json({ message: "Only the organizer can delete this meeting" });

    await pool.query(`DELETE FROM meetings WHERE id = $1`, [id]);

    // Notify attendees
    const io = req.io;
    if (io) {
      const attendees = await pool.query(
        `SELECT user_id FROM meeting_attendees WHERE meeting_id = $1`,
        [id]
      );
      attendees.rows.forEach(({ user_id }) => {
        if (user_id !== userId) {
          io.to(`user:${user_id}`).emit("meeting_cancelled", {
            meeting_id: id,
            message: `"${existing.rows[0].title}" has been cancelled`,
          });
        }
      });
    }

    res.json({ message: "Meeting deleted" });
  } catch (err) {
    console.error("DELETE /meetings/:id error:", err);
    res.status(500).json({ message: "Failed to delete meeting" });
  }
});

// ─── PUT /meetings/:id/rsvp ───────────────────────────────────────────────────
router.put("/:id/rsvp", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const { rsvp_status } = req.body; // "accepted" | "declined"

    if (!["accepted", "declined"].includes(rsvp_status))
      return res.status(400).json({ message: "rsvp_status must be accepted or declined" });

    const result = await pool.query(
      `UPDATE meeting_attendees SET rsvp_status = $1
       WHERE meeting_id = $2 AND user_id = $3
       RETURNING *`,
      [rsvp_status, id, userId]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ message: "You are not an attendee of this meeting" });

    res.json({ message: `RSVP updated to ${rsvp_status}`, ...result.rows[0] });
  } catch (err) {
    console.error("PUT /meetings/:id/rsvp error:", err);
    res.status(500).json({ message: "Failed to update RSVP" });
  }
});

export default router;
