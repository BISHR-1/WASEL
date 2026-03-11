-- Users table for password-based authentication
-- This table stores user accounts with hashed passwords

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  phone TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on verified users
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(is_verified);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY users_select_own 
ON users FOR SELECT 
USING (auth.uid()::text = id::text);

-- Policy: Users can update their own data
CREATE POLICY users_update_own 
ON users FOR UPDATE 
USING (auth.uid()::text = id::text);

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts with password-based authentication';
COMMENT ON COLUMN users.email IS 'User email address (unique identifier)';
COMMENT ON COLUMN users.password_hash IS 'Hashed password using bcrypt or argon2';
COMMENT ON COLUMN users.is_verified IS 'Email verification status via OTP';
COMMENT ON COLUMN users.phone IS 'Optional phone number for notifications';
COMMENT ON COLUMN users.full_name IS 'User full name';
