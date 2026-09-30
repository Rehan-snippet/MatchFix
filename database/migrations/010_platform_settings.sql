-- -----------------------------------------------------------------------------
-- Migration 010: Platform System Configuration & Operational Settings
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS platform_settings (
  setting_key VARCHAR(50) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO platform_settings (setting_key, setting_value, description)
VALUES
  ('commission_rate', '8', 'Platform commission percentage charged to organizers and sellers on gross transactions'),
  ('advance_percentage', '20', 'Mandatory advance payment percentage for Cash at Venue pitch reservations and Cash on Delivery orders'),
  ('broadcast_enabled', 'false', 'Global broadcast banner display across the web platform'),
  ('broadcast_message', 'Welcome to MatchFix! Book top football arenas across Dhaka and shop authentic gear with fast delivery.', 'Broadcast announcement message shown to platform users'),
  ('broadcast_type', 'info', 'Broadcast banner severity style: info, warning, success, alert'),
  ('maintenance_mode', 'false', 'Flag indicating scheduled platform maintenance mode'),
  ('support_phone', '+880 1700-000000', 'Official MatchFix support helpline phone number'),
  ('support_email', 'support@matchfix.dev', 'Official MatchFix support email address')
ON CONFLICT (setting_key) DO NOTHING;
