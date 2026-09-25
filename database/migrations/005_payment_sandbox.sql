-- ============================================================
-- Migration 005: Payment Sandbox Infrastructure
-- ============================================================

-- Stores initiated payment intents before confirmation
CREATE TABLE IF NOT EXISTS payment_intents (
  intent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  booking_id INTEGER REFERENCES bookings(booking_id) ON DELETE SET NULL,
  order_id INTEGER REFERENCES orders(order_id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'BDT',
  method VARCHAR(50) NOT NULL DEFAULT 'sandbox_card',
  status VARCHAR(20) NOT NULL DEFAULT 'initiated'
    CHECK (status IN ('initiated', 'processing', 'completed', 'failed', 'expired')),
  gateway VARCHAR(30) NOT NULL DEFAULT 'sandbox',
  gateway_ref VARCHAR(200),
  checkout_url TEXT,
  sandbox_card VARCHAR(20),
  error_message TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 minutes',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_at TIMESTAMPTZ,
  CONSTRAINT chk_intent_settles_one CHECK (
    (booking_id IS NOT NULL AND order_id IS NULL) OR
    (booking_id IS NULL AND order_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_payment_intents_user ON payment_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_booking ON payment_intents(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_intents_order ON payment_intents(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_intents_expires ON payment_intents(expires_at) WHERE status = 'initiated';
