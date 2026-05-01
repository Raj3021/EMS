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
    console.log("Applying Project Owner Migration...");
    await client.query(`
      ALTER TABLE public.projects 
      ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES public.users(id) ON DELETE SET NULL;
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
