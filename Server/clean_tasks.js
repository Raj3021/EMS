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

async function clean() {
  const client = await pool.connect();
  try {
    console.log("Cleaning tasks, projects, and project_team tables...");
    await client.query("TRUNCATE TABLE projects CASCADE;");
    await client.query("TRUNCATE TABLE tasks CASCADE;");
    console.log("Database tables cleaned successfully!");
  } catch (err) {
    console.error("Failed to clean database:", err);
  } finally {
    client.release();
    pool.end();
  }
}

clean();
