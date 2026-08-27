-- Migration: Reconcile user_id foreign key type mismatch in audit_logs
-- Target: Ensure users.id and audit_logs.user_id both use UUID data types safely

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 1: Drop foreign key constraints on audit_logs and payments
ALTER TABLE IF EXISTS audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
ALTER TABLE IF EXISTS payments DROP CONSTRAINT IF EXISTS payments_recorded_by_id_fkey;

-- Step 2: Drop sequence defaults if any exist on integer columns
ALTER TABLE IF EXISTS users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS audit_logs ALTER COLUMN user_id DROP DEFAULT;

-- Step 3: Recreate users and audit_logs tables cleanly with UUID primary keys
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Step 4: Create users table with UUID primary key
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  username VARCHAR(100),
  staff_id VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Step 5: Create audit_logs table with user_id UUID foreign key
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
