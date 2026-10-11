-- Sneaker Design Studio Database Schema for PostgreSQL / Supabase

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Designs Table
CREATE TABLE IF NOT EXISTS designs (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  model VARCHAR(50) NOT NULL,
  components JSONB NOT NULL DEFAULT '{}'::jsonb,
  materials JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast user designs lookup
CREATE INDEX IF NOT EXISTS idx_designs_user_id ON designs(user_id);

-- 3. Design Versions Table (Version History)
CREATE TABLE IF NOT EXISTS design_versions (
  id SERIAL PRIMARY KEY,
  design_id INT NOT NULL REFERENCES designs (id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  model VARCHAR(50) NOT NULL,
  components JSONB NOT NULL DEFAULT '{}'::jsonb,
  materials JSONB NOT NULL DEFAULT '{}'::jsonb,
  change_summary VARCHAR(255) DEFAULT 'Design update',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast version lookup
CREATE INDEX IF NOT EXISTS idx_design_versions_design_id ON design_versions(design_id);
