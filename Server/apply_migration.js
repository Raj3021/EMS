import bg from "pg";
const { Pool } = bg;
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Applying migration...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.user_settings (
          user_id uuid NOT NULL,
          theme character varying(20) DEFAULT 'system',
          language character varying(10) DEFAULT 'en-US',
          notifications jsonb DEFAULT '{}',
          created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT user_settings_pkey PRIMARY KEY (user_id),
          CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
      );
    `);
    console.log("Migration applied successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
