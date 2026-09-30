-- -----------------------------------------------------------------------------
-- Migration 011: Admin Audit Logs
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  log_id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  action VARCHAR(80) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id VARCHAR(50),
  details JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON admin_audit_logs(target_type, target_id);
