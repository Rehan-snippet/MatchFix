-- ============================================================
-- Migration 006: Fix Turfs and Payments Columns & Constraints
-- ============================================================

ALTER TABLE turfs ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10, 2) DEFAULT 1500.00;
ALTER TABLE turfs ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 4.80;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Backfill turfs default values
UPDATE turfs SET hourly_rate = 1500.00 WHERE hourly_rate IS NULL;
UPDATE turfs SET rating = 4.80 WHERE rating IS NULL;

-- Allow both 'completed' and 'success' in payments status check
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check 
  CHECK (status IN ('pending', 'success', 'completed', 'failed', 'refunded'));
