import { pool } from '../db.js';

const sql = `
  CREATE TABLE IF NOT EXISTS public.meetings (
    id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_by    uuid REFERENCES users(id) ON DELETE SET NULL,
    title         varchar(255) NOT NULL,
    description   text,
    location      varchar(255),
    meeting_type  varchar(50) DEFAULT 'scheduled',
    start_time    timestamp NOT NULL,
    end_time      timestamp NOT NULL,
    status        varchar(50) DEFAULT 'upcoming',
    created_at    timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at    timestamp DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS public.meeting_attendees (
    meeting_id   uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rsvp_status  varchar(20) DEFAULT 'pending',
    PRIMARY KEY (meeting_id, user_id)
  );

  CREATE INDEX IF NOT EXISTS idx_meetings_tenant     ON public.meetings USING btree (tenant_id);
  CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON public.meetings USING btree (start_time);
  CREATE INDEX IF NOT EXISTS idx_meetings_created_by ON public.meetings USING btree (created_by);
  CREATE INDEX IF NOT EXISTS idx_meeting_attendees_meeting ON public.meeting_attendees USING btree (meeting_id);
  CREATE INDEX IF NOT EXISTS idx_meeting_attendees_user    ON public.meeting_attendees USING btree (user_id);
`;

try {
  await pool.query(sql);
  console.log('✅ meetings + meeting_attendees tables created successfully');
} catch (e) {
  console.error('❌ Migration failed:', e.message);
} finally {
  process.exit(0);
}
