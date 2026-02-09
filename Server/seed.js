import bg from "pg";
const { Pool } = bg;
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log("Connected to database...");

    // Read schema file
    const schemaPath = path.join(__dirname, "schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");

    console.log("Applying schema...");
    await client.query(schemaSql);
    console.log("Schema applied.");

    // Check if tenant exists
    const tenantCheck = await client.query("SELECT * FROM tenants LIMIT 1");
    if (tenantCheck.rowCount > 0) {
      console.log("Database already seeded.");
      return;
    }

    console.log("Seeding initial data...");

    // 1. Create Tenant
    const tenantResult = await client.query(
      "INSERT INTO tenants (name, domain) VALUES ($1, $2) RETURNING id",
      ["Demo Corp", "demo"]
    );
    const tenantId = tenantResult.rows[0].id;
    console.log("Tenant created:", tenantId);

    // 2. Create Roles
    const rolesData = [
      { name: "admin", description: "Administrator" },
      { name: "manager", description: "Manager" },
      { name: "employee", description: "Employee" },
    ];

    const roleMap = {};

    for (const role of rolesData) {
      const res = await client.query(
        "INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id, name",
        [role.name, role.description]
      );
      roleMap[res.rows[0].name] = res.rows[0].id;
    }
    console.log("Roles created.");

    // 3. Create Permissions
    const permissionsData = [
      "create_employee",
      "read_employee",
      "update_employee",
      "delete_employee",
    ];

    const permMap = {};
    for (const perm of permissionsData) {
        const res = await client.query(
            "INSERT INTO permissions (name) VALUES ($1) RETURNING id, name",
            [perm]
        );
        permMap[res.rows[0].name] = res.rows[0].id;
    }

    // 4. Assign permissions to Admin Role
    for (const permId of Object.values(permMap)) {
        await client.query(
            "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)",
            [roleMap["admin"], permId]
        );
    }
    console.log("Permissions assigned.");

    // 5. Create Admin User
    const hashedPassword = await bcrypt.hash("password123", 10);
    const userResult = await client.query(
      "INSERT INTO users (tenant_id, email, password_hash, is_email_verified) VALUES ($1, $2, $3, $4) RETURNING id",
      [tenantId, "admin@demo.com", hashedPassword, true]
    );
    const userId = userResult.rows[0].id;
    console.log("Admin user created:", userId);

    // 6. Assign Admin Role to User
    await client.query(
      "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
      [userId, roleMap["admin"]]
    );

    // 7. Create Employee Profile for Admin
    await client.query(
        "INSERT INTO employees (tenant_id, user_id, first_name, last_name, email, designation, department, joining_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [tenantId, userId, "Admin", "User", "admin@demo.com", "System Admin", "IT", new Date()]
    );

    console.log("Seeding complete!");
    console.log("Login with: admin@demo.com / password123 (Tenant Domain: demo)");

  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
