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

// Migration: Add status column to employees table
await pool.query(`
  DO $$ 
  BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='status') THEN 
      ALTER TABLE employees ADD COLUMN status VARCHAR(20) DEFAULT 'active'; 
    END IF; 
  END $$;
`);

export default pool;
export { pool, uuidv4 };
