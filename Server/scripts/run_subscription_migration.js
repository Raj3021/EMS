import { pool } from "../db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("🔄 Running subscription migration...\n");

    // 1. Create subscription tables (if not exist - they should be in schema.sql already)
    // But let's ensure the tables exist
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
    console.log("✅ subscription_plans table ready");

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
    console.log("✅ tenant_subscriptions table ready");

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
    console.log("✅ payment_history table ready");

    // 2. Create indexes (IF NOT EXISTS)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON public.tenant_subscriptions USING btree (tenant_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON public.tenant_subscriptions USING btree (status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payment_history_tenant ON public.payment_history USING btree (tenant_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_payment_history_created ON public.payment_history USING btree (created_at DESC);`);
    console.log("✅ Indexes created");

    // 3. Add current_plan to tenants
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='current_plan') THEN 
          ALTER TABLE tenants ADD COLUMN current_plan VARCHAR(50) DEFAULT 'free'; 
        END IF; 
      END $$;
    `);
    console.log("✅ tenants.current_plan column ready");

    // 4. Seed plans
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
    console.log("✅ Default plans seeded");

    console.log("\n🎉 Subscription migration complete!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
