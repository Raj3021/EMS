-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

-- Table: tenants
CREATE TABLE public.tenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    domain character varying(255),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tenants_pkey PRIMARY KEY (id),
    CONSTRAINT tenants_domain_key UNIQUE (domain)
);

-- Table: users
CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    is_email_verified boolean DEFAULT false,
    is_active boolean DEFAULT true,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    token_version integer DEFAULT 1,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_tenant_id_email_key UNIQUE (tenant_id, email),
    CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- Indexes for users
CREATE INDEX idx_users_email ON public.users USING btree (email);
CREATE INDEX idx_users_tenant ON public.users USING btree (tenant_id);

-- Table: roles
CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid,
    name character varying(50) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT roles_pkey PRIMARY KEY (id),
    CONSTRAINT roles_tenant_id_name_key UNIQUE (tenant_id, name),
    CONSTRAINT roles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- Table: permissions
CREATE TABLE public.permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    CONSTRAINT permissions_pkey PRIMARY KEY (id),
    CONSTRAINT permissions_name_key UNIQUE (name)
);

-- Table: user_roles
CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id),
    CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE
);

-- Table: role_permissions
CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id),
    CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE,
    CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE
);

-- Table: auth_sessions
CREATE TABLE public.auth_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    refresh_token text NOT NULL,
    user_agent text,
    ip_address character varying(50),
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT auth_sessions_pkey PRIMARY KEY (id),
    CONSTRAINT auth_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Index for auth_sessions
CREATE INDEX idx_sessions_user ON public.auth_sessions USING btree (user_id);

-- Table: employees
CREATE TABLE public.employees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid,
    first_name character varying(100) NOT NULL,
    last_name character varying(100),
    email character varying(255),
    phone character varying(20),
    designation character varying(100),
    department character varying(100),
    joining_date date,
    profile_completed boolean DEFAULT false,
    is_active boolean DEFAULT true,
    status character varying(20) DEFAULT 'active',
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT employees_pkey PRIMARY KEY (id),
    CONSTRAINT employees_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL
);

-- Table: invites
CREATE TABLE public.invites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    role_id uuid,
    department character varying(100),
    token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    invited_by uuid,
    accepted_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT invites_pkey PRIMARY KEY (id),
    CONSTRAINT invites_token_key UNIQUE (token),
    CONSTRAINT invites_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT invites_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
    CONSTRAINT invites_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.users(id)
);

-- Table: refresh_tokens
CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    revoked boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by_ip inet,
    replaced_by_token text,
    CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id),
    CONSTRAINT refresh_tokens_token_hash_key UNIQUE (token_hash),
    CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT refresh_tokens_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- Indexes for refresh_tokens
CREATE INDEX idx_refresh_tokens_token_hash ON public.refresh_tokens USING btree (token_hash);
CREATE INDEX idx_refresh_tokens_user_id ON public.refresh_tokens USING btree (user_id);

-- Table: user_settings
CREATE TABLE public.user_settings (
    user_id uuid NOT NULL,
    theme character varying(20) DEFAULT 'light',
    language character varying(10) DEFAULT 'en-US',
    notifications jsonb DEFAULT '{}',
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_settings_pkey PRIMARY KEY (user_id),
    CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- ============================================
-- CHAT SYSTEM TABLES
-- ============================================

-- Table: conversations
CREATE TABLE public.conversations (
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

-- Table: conversation_participants
CREATE TABLE public.conversation_participants (
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

-- Table: messages
CREATE TABLE public.messages (
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

-- Indexes for chat performance
CREATE INDEX idx_conversations_tenant ON public.conversations USING btree (tenant_id);
CREATE INDEX idx_conversations_updated_at ON public.conversations USING btree (updated_at DESC);
CREATE INDEX idx_messages_conversation ON public.messages USING btree (conversation_id, created_at DESC);
CREATE INDEX idx_participants_conversation ON public.conversation_participants USING btree (conversation_id);
CREATE INDEX idx_participants_user ON public.conversation_participants USING btree (user_id);

-- ============================================
-- NOTES SYSTEM TABLES
-- ============================================

-- Table: notes
CREATE TABLE public.notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    title character varying(255),
    content text,
    tags text[],
    linked_to character varying(255),
    color character varying(20) DEFAULT 'default',
    is_pinned boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notes_pkey PRIMARY KEY (id),
    CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT notes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- Indexes for notes
CREATE INDEX idx_notes_user_id ON public.notes USING btree (user_id);
CREATE INDEX idx_notes_tenant_id ON public.notes USING btree (tenant_id);
CREATE INDEX idx_notes_created_at ON public.notes USING btree (created_at DESC);

CREATE TABLE IF NOT EXISTS public.files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(50) NOT NULL,
    size integer NOT NULL,
    url text NOT NULL,
    cloudinary_id character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT files_pkey PRIMARY KEY (id),
    CONSTRAINT files_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT files_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Creating indexes for faster fetching
CREATE INDEX IF NOT EXISTS idx_files_tenant ON public.files USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_files_user ON public.files USING btree (user_id);

-- ============================================
-- TASKS & PROJECTS SYSTEM TABLES
-- ============================================

-- Table: projects
CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    owner_id uuid,
    name character varying(255) NOT NULL,
    status character varying(50) DEFAULT 'active',
    progress integer DEFAULT 0,
    deadline timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT projects_pkey PRIMARY KEY (id),
    CONSTRAINT projects_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT projects_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE SET NULL
);

-- Table: project_team
CREATE TABLE public.project_team (
    project_id uuid NOT NULL,
    user_id uuid NOT NULL,
    CONSTRAINT project_team_pkey PRIMARY KEY (project_id, user_id),
    CONSTRAINT project_team_project_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
    CONSTRAINT project_team_user_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Table: tasks
CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    project_id uuid,
    assignee_id uuid,
    title character varying(255) NOT NULL,
    description text,
    priority character varying(50) DEFAULT 'medium',
    status character varying(50) DEFAULT 'todo',
    due_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tasks_pkey PRIMARY KEY (id),
    CONSTRAINT tasks_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT tasks_project_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE,
    CONSTRAINT tasks_assignee_fkey FOREIGN KEY (assignee_id) REFERENCES public.users(id) ON DELETE SET NULL
);

-- Indexes for Tasks and Projects
CREATE INDEX idx_projects_tenant ON public.projects USING btree (tenant_id);
CREATE INDEX idx_tasks_tenant ON public.tasks USING btree (tenant_id);
CREATE INDEX idx_tasks_project ON public.tasks USING btree (project_id);
CREATE INDEX idx_tasks_assignee ON public.tasks USING btree (assignee_id);

-- ============================================
-- LEAVES MANAGEMENT SYSTEM TABLES
-- ============================================

-- Table: leave_types
CREATE TABLE public.leave_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    default_days numeric(5,1) DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT leave_types_pkey PRIMARY KEY (id),
    CONSTRAINT leave_types_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT leave_types_tenant_name_unique UNIQUE (tenant_id, name)
);

-- Table: leave_balances
CREATE TABLE public.leave_balances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    leave_type_id uuid NOT NULL,
    total_days numeric(5,1) DEFAULT 0,
    used_days numeric(5,1) DEFAULT 0,
    remaining_days numeric(5,1) DEFAULT 0,
    year integer NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT leave_balances_pkey PRIMARY KEY (id),
    CONSTRAINT leave_balances_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT leave_balances_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT leave_balances_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(id) ON DELETE CASCADE,
    CONSTRAINT leave_balances_unique UNIQUE (user_id, leave_type_id, year)
);

-- Table: leave_requests
CREATE TABLE public.leave_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    leave_type_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    total_days numeric(5,1) NOT NULL,
    reason text NOT NULL,
    attachment_url text,
    status character varying(50) DEFAULT 'pending',
    reviewed_by uuid,
    rejection_reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT leave_requests_pkey PRIMARY KEY (id),
    CONSTRAINT leave_requests_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT leave_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT leave_requests_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(id) ON DELETE CASCADE,
    CONSTRAINT leave_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL
);

-- Indexes for faster queries
CREATE INDEX idx_leave_balances_user ON public.leave_balances USING btree (user_id);
CREATE INDEX idx_leave_balances_tenant ON public.leave_balances USING btree (tenant_id);
CREATE INDEX idx_leave_requests_user ON public.leave_requests USING btree (user_id);
CREATE INDEX idx_leave_requests_tenant ON public.leave_requests USING btree (tenant_id);
CREATE INDEX idx_leave_requests_status ON public.leave_requests USING btree (status);


CREATE TABLE IF NOT EXISTS public.meetings (
    id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_by    uuid REFERENCES users(id) ON DELETE SET NULL,
    title         varchar(255) NOT NULL,
    description   text,
    location      varchar(255),
    meeting_type  varchar(50) DEFAULT 'scheduled',
    start_time    timestamp NOT NULL,
    end_time      timestamp NOT NULL,
    status        varchar(50) DEFAULT 'upcoming',
    created_at    timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at    timestamp DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS public.meeting_attendees (
    meeting_id   uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rsvp_status  varchar(20) DEFAULT 'pending',
    PRIMARY KEY (meeting_id, user_id)
  );

  CREATE INDEX IF NOT EXISTS idx_meetings_tenant     ON public.meetings USING btree (tenant_id);
  CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON public.meetings USING btree (start_time);
  CREATE INDEX IF NOT EXISTS idx_meetings_created_by ON public.meetings USING btree (created_by);
  CREATE INDEX IF NOT EXISTS idx_meeting_attendees_meeting ON public.meeting_attendees USING btree (meeting_id);
  CREATE INDEX IF NOT EXISTS idx_meeting_attendees_user    ON public.meeting_attendees USING btree (user_id);

-- ============================================
-- SUBSCRIPTION SYSTEM TABLES
-- ============================================

-- Table: subscription_plans (stores plan definitions)
CREATE TABLE public.subscription_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL,          -- 'free', 'pro', 'enterprise'
    display_name character varying(100) NOT NULL,  -- 'Free', 'Pro', 'Enterprise'
    description text,
    price_monthly numeric(10,2) DEFAULT 0,         -- in INR
    price_yearly numeric(10,2) DEFAULT 0,          -- in INR (discounted)
    currency character varying(3) DEFAULT 'INR',
    features jsonb NOT NULL DEFAULT '{}',          -- feature limits as JSON
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT subscription_plans_pkey PRIMARY KEY (id),
    CONSTRAINT subscription_plans_name_key UNIQUE (name)
);

-- Table: tenant_subscriptions (tracks each tenant's active subscription)
CREATE TABLE public.tenant_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    plan_id uuid NOT NULL,
    status character varying(30) DEFAULT 'active',  -- active, cancelled, expired, past_due
    billing_cycle character varying(20) DEFAULT 'monthly',  -- monthly, yearly
    
    -- Razorpay references
    razorpay_subscription_id character varying(255),
    razorpay_customer_id character varying(255),
    razorpay_plan_id character varying(255),
    
    -- Billing dates
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

-- Table: payment_history (audit trail of all payments)
CREATE TABLE public.payment_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    subscription_id uuid,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'INR',
    status character varying(30) NOT NULL,  -- captured, failed, refunded
    
    -- Razorpay references
    razorpay_payment_id character varying(255),
    razorpay_order_id character varying(255),
    razorpay_signature character varying(255),
    
    payment_method character varying(50),  -- card, upi, netbanking, wallet
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

-- Indexes
CREATE INDEX idx_tenant_subscriptions_tenant ON public.tenant_subscriptions USING btree (tenant_id);
CREATE INDEX idx_tenant_subscriptions_status ON public.tenant_subscriptions USING btree (status);
CREATE INDEX idx_payment_history_tenant ON public.payment_history USING btree (tenant_id);
CREATE INDEX idx_payment_history_created ON public.payment_history USING btree (created_at DESC);
