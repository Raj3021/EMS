
import { pool } from "../db.js";

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Starting migration...");
    await client.query("BEGIN");

    // Check if column exists
    const check = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='employees' AND column_name='status'
    `);

    if (check.rowCount === 0) {
      console.log("Adding status column to employees table...");
      await client.query(`
        ALTER TABLE employees 
        ADD COLUMN status VARCHAR(20) DEFAULT 'active'
      `);
      
      // Update existing rows to have 'active' status
      await client.query(`
        UPDATE employees SET status = 'active' WHERE status IS NULL
      `);
      
      console.log("Column added successfully.");
    } else {
      console.log("Column status already exists.");
    }

    await client.query("COMMIT");
    console.log("Migration complete.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err);
  } finally {
    client.release();
    process.exit(); 
  }
}

migrate();
