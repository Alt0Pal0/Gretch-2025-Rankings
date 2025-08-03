-- Authentication schema for edit rankings protection
-- Passwords for accessing the edit interface
CREATE TABLE IF NOT EXISTS edit_passwords (
  id SERIAL PRIMARY KEY,
  password VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Access attempt logs for audit trail
CREATE TABLE IF NOT EXISTS edit_access_logs (
  id SERIAL PRIMARY KEY,
  ip_address INET,
  user_agent TEXT,
  password_attempted VARCHAR(100),
  success BOOLEAN NOT NULL,
  session_token VARCHAR(64),
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Insert the two passwords
INSERT INTO edit_passwords (password, description) VALUES 
  ('StealingBananas!', 'Primary edit access password'),
  ('B3nGr3tch!', 'Secondary edit access password')
ON CONFLICT DO NOTHING;