-- Run this query in pgAdmin to manually add the missing column
ALTER TABLE employees ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
