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
    console.log("Applying Tasks and Projects migration...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.projects (
          id uuid DEFAULT gen_random_uuid() NOT NULL,
          tenant_id uuid NOT NULL,
          name character varying(255) NOT NULL,
          status character varying(50) DEFAULT 'active',
          progress integer DEFAULT 0,
          deadline date,
          created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT projects_pkey PRIMARY KEY (id),
          CONSTRAINT projects_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS public.project_team (
          project_id uuid NOT NULL,
          user_id uuid NOT NULL,
          CONSTRAINT project_team_pkey PRIMARY KEY (project_id, user_id),
          CONSTRAINT project_team_project_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
          CONSTRAINT project_team_user_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS public.tasks (
          id uuid DEFAULT gen_random_uuid() NOT NULL,
          tenant_id uuid NOT NULL,
          project_id uuid,
          title character varying(255) NOT NULL,
          description text,
          assignee_id uuid,
          priority character varying(20) DEFAULT 'medium',
          status character varying(20) DEFAULT 'todo',
          due_date date,
          created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT tasks_pkey PRIMARY KEY (id),
          CONSTRAINT tasks_project_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
          CONSTRAINT tasks_assignee_fkey FOREIGN KEY (assignee_id) REFERENCES public.users(id) ON DELETE SET NULL,
          CONSTRAINT tasks_tenant_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
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
