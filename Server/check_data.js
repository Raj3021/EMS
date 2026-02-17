import pool from "./db.js";

async function checkData() {
  try {
    console.log("--- TENANTS ---");
    const tenants = await pool.query("SELECT id, name, domain FROM tenants");
    console.table(tenants.rows);

    console.log("\n--- EMPLOYEES ---");
    const employees = await pool.query("SELECT id, first_name, email, tenant_id, is_active FROM employees");
    console.table(employees.rows);

    console.log("\n--- USERS ---");
    const users = await pool.query("SELECT id, email, tenant_id, is_active FROM users");
    console.table(users.rows);
    
    console.log("\n--- INVITES ---");
    const invites = await pool.query("SELECT id, email, tenant_id, expires_at, accepted_at FROM invites");
    console.table(invites.rows);

  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

checkData();
