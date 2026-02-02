import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

export default pool;
export { pool, uuidv4 };
