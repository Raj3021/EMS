import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect specifically to the Render DB using the URL
// Render requires SSL for external connections
const pool = new pg.Pool({
  connectionString: process.env.RENDER_DB_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("🚀 Connecting to Render Production Database...");
    
    // 1. Run the main schema.sql
    console.log("⏳ Reading schema.sql...");
    const schemaPath = path.join(__dirname, "..", "schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf-8");
    
    console.log("⚙️ Executing main schema on Render...");
    await client.query(schemaSql);
    console.log("✅ Main schema applied successfully!");

    // 2. Add the status column to employees (since it's a later migration)
    console.log("⚙️ Ensuring employees.status column exists...");
    await client.query(`
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'employees') THEN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='status') THEN 
            ALTER TABLE employees ADD COLUMN status VARCHAR(20) DEFAULT 'active'; 
          END IF; 
        END IF;
      END $$;
    `);

    // 3. Create subscription tables
    console.log("⚙️ Creating subscription tables...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.subscription_plans (
        id uuid DEFAULT gen_random_uuid() NOT NULL,
        name character varying(50) NOT NULL,
        display_name character varying(100) NOT NULL,
        description text,
        price_monthly numeric(10,2) DEFAULT 0,
        price_yearly numeric(10,2) DEFAULT 0,
        currency character varying(3) DEFAULT 'INR',
        features jsonb NOT NULL DEFAULT '{}',
        is_active boolean DEFAULT true,
        sort_order integer DEFAULT 0,
        created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT subscription_plans_pkey PRIMARY KEY (id),
        CONSTRAINT subscription_plans_name_key UNIQUE (name)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
        id uuid DEFAULT gen_random_uuid() NOT NULL,
        tenant_id uuid NOT NULL,
        plan_id uuid NOT NULL,
        status character varying(30) DEFAULT 'active',
        billing_cycle character varying(20) DEFAULT 'monthly',
        razorpay_subscription_id character varying(255),
        razorpay_customer_id character varying(255),
        razorpay_plan_id character varying(255),
        current_period_start timestamp without time zone,
        current_period_end timestamp without time zone,
        cancelled_at timestamp without time zone,
        trial_end timestamp without time zone,
        created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT tenant_subscriptions_pkey PRIMARY KEY (id),
        CONSTRAINT tenant_subscriptions_tenant_id_fkey FOREIGN KEY (tenant_id) 
            REFERENCES public.tenants(id) ON DELETE CASCADE,
        CONSTRAINT tenant_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) 
            REFERENCES public.subscription_plans(id),
        CONSTRAINT tenant_subscriptions_tenant_unique UNIQUE (tenant_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.payment_history (
        id uuid DEFAULT gen_random_uuid() NOT NULL,
        tenant_id uuid NOT NULL,
        subscription_id uuid,
        amount numeric(10,2) NOT NULL,
        currency character varying(3) DEFAULT 'INR',
        status character varying(30) NOT NULL,
        razorpay_payment_id character varying(255),
        razorpay_order_id character varying(255),
        razorpay_signature character varying(255),
        payment_method character varying(50),
        description text,
        invoice_url text,
        metadata jsonb DEFAULT '{}',
        created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT payment_history_pkey PRIMARY KEY (id),
        CONSTRAINT payment_history_tenant_id_fkey FOREIGN KEY (tenant_id) 
            REFERENCES public.tenants(id) ON DELETE CASCADE,
        CONSTRAINT payment_history_subscription_id_fkey FOREIGN KEY (subscription_id) 
            REFERENCES public.tenant_subscriptions(id) ON DELETE SET NULL
      );
    `);

    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON public.tenant_subscriptions USING btree (tenant_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON public.tenant_subscriptions USING btree (status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payment_history_tenant ON public.payment_history USING btree (tenant_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payment_history_created ON public.payment_history USING btree (created_at DESC);`);

    // Add current_plan to tenants
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='current_plan') THEN 
          ALTER TABLE tenants ADD COLUMN current_plan VARCHAR(50) DEFAULT 'free'; 
        END IF; 
      END $$;
    `);

    // Seed plans
    await client.query(`
      INSERT INTO public.subscription_plans (name, display_name, description, price_monthly, price_yearly, features, sort_order) 
      VALUES
      (
        'free', 'Free', 'Get started with essential features',
        0, 0,
        '{"max_employees": 5, "max_projects": 2, "max_tasks": 20, "max_storage_mb": 100, "max_notes": 10}'::jsonb,
        1
      ),
      (
        'pro', 'Pro', 'Everything you need to manage your team',
        499, 4990,
        '{"max_employees": 25, "max_projects": -1, "max_tasks": -1, "max_storage_mb": 5120, "max_notes": -1}'::jsonb,
        2
      ),
      (
        'enterprise', 'Enterprise', 'For large organizations with advanced needs',
        1499, 14990,
        '{"max_employees": -1, "max_projects": -1, "max_tasks": -1, "max_storage_mb": 51200, "max_notes": -1}'::jsonb,
        3
      )
      ON CONFLICT (name) DO NOTHING;
    `);

    console.log("✅ Subscription setup complete!");
    console.log("\n🎉 Render Production Database is 100% ready!");

  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
