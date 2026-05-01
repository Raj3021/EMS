-- Subscription System Migration
-- Run this file to set up the subscription tables and seed data

-- Add current_plan column to tenants table
ALTER TABLE public.tenants 
    ADD COLUMN IF NOT EXISTS current_plan character varying(50) DEFAULT 'free';

-- Seed default subscription plans (skip if already exist)
INSERT INTO public.subscription_plans (name, display_name, description, price_monthly, price_yearly, features, sort_order) 
VALUES
(
    'free', 'Free', 'Get started with essential features',
    0, 0,
    '{
        "max_employees": 5,
        "max_projects": 2,
        "max_tasks": 20,
        "max_storage_mb": 100,
        "max_notes": 10
    }'::jsonb,
    1
),
(
    'pro', 'Pro', 'Everything you need to manage your team',
    499, 4990,
    '{
        "max_employees": 25,
        "max_projects": -1,
        "max_tasks": -1,
        "max_storage_mb": 5120,
        "max_notes": -1
    }'::jsonb,
    2
),
(
    'enterprise', 'Enterprise', 'For large organizations with advanced needs',
    1499, 14990,
    '{
        "max_employees": -1,
        "max_projects": -1,
        "max_tasks": -1,
        "max_storage_mb": 51200,
        "max_notes": -1
    }'::jsonb,
    3
)
ON CONFLICT (name) DO NOTHING;
