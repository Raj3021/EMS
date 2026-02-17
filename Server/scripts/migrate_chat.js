import pg from "pg";
const { Pool } = pg;
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function migrateChat() {
  const client = await pool.connect();
  try {
    console.log("🚀 Starting chat tables migration...");
    
    // Create conversations table
    console.log("Creating conversations table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.conversations (
        id uuid DEFAULT gen_random_uuid() NOT NULL,
        tenant_id uuid NOT NULL,
        name character varying(255),
        is_group boolean DEFAULT false,
        created_by uuid NOT NULL,
        created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT conversations_pkey PRIMARY KEY (id),
        CONSTRAINT conversations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
        CONSTRAINT conversations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE
      );
    `);
    console.log("✅ Conversations table created");

    // Create conversation_participants table
    console.log("Creating conversation_participants table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.conversation_participants (
        id uuid DEFAULT gen_random_uuid() NOT NULL,
        conversation_id uuid NOT NULL,
        user_id uuid NOT NULL,
        joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        last_read_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT conversation_participants_pkey PRIMARY KEY (id),
        CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE,
        CONSTRAINT conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
        CONSTRAINT conversation_participants_unique UNIQUE (conversation_id, user_id)
      );
    `);
    console.log("✅ Conversation participants table created");

    // Create messages table
    console.log("Creating messages table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.messages (
        id uuid DEFAULT gen_random_uuid() NOT NULL,
        conversation_id uuid NOT NULL,
        sender_id uuid NOT NULL,
        content text NOT NULL,
        message_type character varying(20) DEFAULT 'text',
        created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT messages_pkey PRIMARY KEY (id),
        CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE,
        CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE
      );
    `);
    console.log("✅ Messages table created");

    // Create indexes for performance
    console.log("Creating indexes...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON public.conversations USING btree (tenant_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations USING btree (updated_at DESC);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages USING btree (conversation_id, created_at DESC);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_participants_conversation ON public.conversation_participants USING btree (conversation_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_participants_user ON public.conversation_participants USING btree (user_id);
    `);
    console.log("✅ All indexes created");

    console.log("\n✨ Chat migration completed successfully!");
    console.log("📊 Created 3 tables: conversations, conversation_participants, messages");
    console.log("🚀 Created 5 performance indexes");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

migrateChat();
