-- =============================================================================
-- MatchFix Database Schema (PostgreSQL 14+)
-- Includes complete ERD tables, 2 Triggers, 2 Functions, 2 Stored Procedures
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Base Extensions & Tables
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  phone VARCHAR(30),
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subclasses (Table-per-subclass sharing user_id as PK)
CREATE TABLE IF NOT EXISTS organizers (
  user_id INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  trade_licence VARCHAR(100),
  payout_account VARCHAR(150),
  approval_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT
);

CREATE TABLE IF NOT EXISTS sellers (
  user_id INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  shop_name VARCHAR(150) NOT NULL,
  payout_account VARCHAR(150),
  approval_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT
);

CREATE TABLE IF NOT EXISTS customers (
  user_id INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  default_address TEXT
);

CREATE TABLE IF NOT EXISTS areas (
  area_id SERIAL PRIMARY KEY,
  name VARCHAR(150) UNIQUE NOT NULL,
  city VARCHAR(100) NOT NULL DEFAULT 'Dhaka',
  center_lat DECIMAL(9, 6),
  center_lng DECIMAL(9, 6)
);

CREATE TABLE IF NOT EXISTS turfs (
  turf_id SERIAL PRIMARY KEY,
  organizer_id INTEGER NOT NULL REFERENCES organizers(user_id) ON DELETE CASCADE,
  area_id INTEGER NOT NULL REFERENCES areas(area_id) ON DELETE RESTRICT,
  name VARCHAR(150) NOT NULL,
  address TEXT NOT NULL,
  hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 1200.00,
  latitude DECIMAL(9, 6),
  longitude DECIMAL(9, 6),
  rating NUMERIC(3, 2),
  description TEXT,
  approval_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS turf_images (
  image_id SERIAL PRIMARY KEY,
  turf_id INTEGER NOT NULL REFERENCES turfs(turf_id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_cover BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX IF NOT EXISTS one_cover_per_turf ON turf_images(turf_id) WHERE is_cover = TRUE;

CREATE TABLE IF NOT EXISTS fields (
  field_id SERIAL PRIMARY KEY,
  turf_id INTEGER NOT NULL REFERENCES turfs(turf_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  surface VARCHAR(50) NOT NULL DEFAULT 'Artificial Turf',
  side_type VARCHAR(20) NOT NULL DEFAULT '5v5'
);

CREATE TABLE IF NOT EXISTS pricing_rules (
  rule_id SERIAL PRIMARY KEY,
  field_id INTEGER NOT NULL REFERENCES fields(field_id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  hourly_rate NUMERIC(10, 2) NOT NULL CHECK (hourly_rate > 0),
  CONSTRAINT chk_pricing_rule_times CHECK (start_time < end_time)
);

CREATE TABLE IF NOT EXISTS price_history (
  history_id SERIAL PRIMARY KEY,
  rule_id INTEGER REFERENCES pricing_rules(rule_id) ON DELETE SET NULL,
  field_id INTEGER NOT NULL REFERENCES fields(field_id) ON DELETE CASCADE,
  old_rate NUMERIC(10, 2),
  new_rate NUMERIC(10, 2) NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Slots table (Weak entity identifying relationship: field_id + slot_date + start_time)
CREATE TABLE IF NOT EXISTS slots (
  field_id INTEGER NOT NULL REFERENCES fields(field_id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  rate_multiplier NUMERIC(3, 2) NOT NULL DEFAULT 1.00,
  PRIMARY KEY (field_id, slot_date, start_time)
);

CREATE TABLE IF NOT EXISTS bookings (
  booking_id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(user_id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'advance_paid', 'confirmed', 'completed', 'cancelled')),
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  payment_method VARCHAR(30) NOT NULL DEFAULT 'online',
  advance_amount NUMERIC(10, 2) DEFAULT 0.00,
  cash_balance NUMERIC(10, 2) DEFAULT 0.00,
  cancel_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS booking_slots (
  booking_id INTEGER NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
  field_id INTEGER NOT NULL,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  PRIMARY KEY (booking_id, field_id, slot_date, start_time),
  FOREIGN KEY (field_id, slot_date, start_time) REFERENCES slots(field_id, slot_date, start_time) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS turf_reviews (
  review_id SERIAL PRIMARY KEY,
  booking_id INTEGER UNIQUE NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Marketplace Tables
CREATE TABLE IF NOT EXISTS products (
  product_id SERIAL PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES sellers(user_id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  category VARCHAR(50) NOT NULL,
  condition VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (condition IN ('new', 'used')),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  description TEXT,
  approval_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_images (
  image_id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_cover BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS orders (
  order_id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(user_id) ON DELETE CASCADE,
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'placed' CHECK (status IN ('placed', 'advance_paid', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  payment_method VARCHAR(30) NOT NULL DEFAULT 'online',
  advance_amount NUMERIC(10, 2) DEFAULT 0.00,
  cash_balance NUMERIC(10, 2) DEFAULT 0.00,
  delivery_address TEXT NOT NULL,
  delivery_phone VARCHAR(30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  qty INTEGER NOT NULL CHECK (qty > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'placed',
  PRIMARY KEY (order_id, product_id)
);

CREATE TABLE IF NOT EXISTS product_reviews (
  review_id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (order_id, product_id) REFERENCES order_items(order_id, product_id) ON DELETE CASCADE,
  CONSTRAINT uq_product_reviews_order_product UNIQUE (order_id, product_id)
);

CREATE TABLE IF NOT EXISTS payments (
  payment_id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(booking_id) ON DELETE CASCADE,
  order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  method VARCHAR(50) NOT NULL DEFAULT 'card',
  status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'success', 'completed', 'failed', 'refunded')),
  purpose VARCHAR(50) NOT NULL DEFAULT 'full',
  is_advance BOOLEAN NOT NULL DEFAULT FALSE,
  trx_id VARCHAR(100),
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_payment_settles_one_target CHECK (
    (booking_id IS NOT NULL AND order_id IS NULL) OR
    (booking_id IS NULL AND order_id IS NOT NULL)
  )
);

-- Payment Intents for checkout and gateway flows
CREATE TABLE IF NOT EXISTS payment_intents (
  intent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  booking_id INTEGER REFERENCES bookings(booking_id) ON DELETE CASCADE,
  order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
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
  purpose VARCHAR(50) NOT NULL DEFAULT 'full',
  CONSTRAINT chk_intent_settles_one CHECK (
    (booking_id IS NOT NULL AND order_id IS NULL) OR
    (booking_id IS NULL AND order_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_payment_intents_user ON payment_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_booking ON payment_intents(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_intents_order ON payment_intents(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_intents_expires ON payment_intents(expires_at) WHERE status = 'initiated';

-- Ensure columns exist on existing databases
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE turfs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Drop old rigid indexes if present
DROP INDEX IF EXISTS one_active_booking_per_slot;
DROP INDEX IF EXISTS one_payment_per_order;
DROP INDEX IF EXISTS one_payment_per_booking;

-- -----------------------------------------------------------------------------
-- 2. Stored Functions
-- -----------------------------------------------------------------------------

-- Function 1: Computes the applicable hourly rate for a pitch at a specific date and time
-- Fixes Bug 2 (no more free 0 BDT slots)
CREATE OR REPLACE FUNCTION fn_get_hourly_rate(
  p_field_id INT,
  p_slot_date DATE,
  p_start_time TIME
)
RETURNS NUMERIC AS $$
DECLARE
  v_dow INT;
  v_rate NUMERIC(10, 2);
BEGIN
  v_dow := EXTRACT(DOW FROM p_slot_date);

  -- Check specific pricing rules matching day of week and time window
  SELECT hourly_rate INTO v_rate
  FROM pricing_rules
  WHERE field_id = p_field_id
    AND day_of_week = v_dow
    AND p_start_time >= start_time
    AND p_start_time < end_time
  ORDER BY rule_id DESC
  LIMIT 1;

  -- Fallback: If no custom rule matches, use the parent turf base rate
  IF v_rate IS NULL THEN
    SELECT t.hourly_rate INTO v_rate
    FROM fields f
    JOIN turfs t ON f.turf_id = t.turf_id
    WHERE f.field_id = p_field_id;
  END IF;

  -- Safety baseline floor to guarantee slots are never free
  IF v_rate IS NULL OR v_rate <= 0 THEN
    v_rate := 1200.00;
  END IF;

  RETURN v_rate;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function 2: Calculates the average rating of a turf from verified non-cancelled reviews
CREATE OR REPLACE FUNCTION fn_turf_avg_rating(p_turf_id INT)
RETURNS NUMERIC AS $$
DECLARE
  v_avg NUMERIC(3, 2);
BEGIN
  SELECT ROUND(COALESCE(AVG(tr.rating), 0)::NUMERIC, 2) INTO v_avg
  FROM turf_reviews tr
  WHERE tr.booking_id IN (
    SELECT DISTINCT bs.booking_id
    FROM booking_slots bs
    JOIN fields f ON bs.field_id = f.field_id
    JOIN bookings b ON bs.booking_id = b.booking_id
    WHERE f.turf_id = p_turf_id
      AND b.status <> 'cancelled'
  );

  RETURN v_avg;
END;
$$ LANGUAGE plpgsql STABLE;

-- -----------------------------------------------------------------------------
-- 3. Triggers
-- -----------------------------------------------------------------------------

-- Trigger 1: Prevents double-booking while freeing slots when a booking is cancelled
-- Race-safe with row-level lock on the slots table
CREATE OR REPLACE FUNCTION fn_check_slot_availability()
RETURNS TRIGGER AS $$
DECLARE
  v_conflict_id INT;
BEGIN
  -- Acquire an exclusive row lock on the target slot to serialize concurrent booking attempts
  PERFORM 1 FROM slots
  WHERE field_id = NEW.field_id
    AND slot_date = NEW.slot_date
    AND start_time = NEW.start_time
  FOR UPDATE;

  SELECT bs.booking_id INTO v_conflict_id
  FROM booking_slots bs
  JOIN bookings b ON bs.booking_id = b.booking_id
  WHERE bs.field_id = NEW.field_id
    AND bs.slot_date = NEW.slot_date
    AND bs.start_time = NEW.start_time
    AND b.status <> 'cancelled'
    AND (NEW.booking_id IS NULL OR bs.booking_id <> NEW.booking_id)
  LIMIT 1;

  IF v_conflict_id IS NOT NULL THEN
    RAISE EXCEPTION 'Slot for field % on % at % is already reserved by active booking #%',
      NEW.field_id, NEW.slot_date, NEW.start_time, v_conflict_id
      USING ERRCODE = '23P01';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_double_booking ON booking_slots;
CREATE TRIGGER trg_prevent_double_booking
BEFORE INSERT ON booking_slots
FOR EACH ROW
EXECUTE FUNCTION fn_check_slot_availability();

-- Trigger 2: Automatically logs rate changes on pricing_rules into price_history
CREATE OR REPLACE FUNCTION fn_log_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.hourly_rate IS DISTINCT FROM NEW.hourly_rate) THEN
    INSERT INTO price_history (rule_id, field_id, old_rate, new_rate, changed_at)
    VALUES (NEW.rule_id, NEW.field_id, OLD.hourly_rate, NEW.hourly_rate, NOW());
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO price_history (rule_id, field_id, old_rate, new_rate, changed_at)
    VALUES (NEW.rule_id, NEW.field_id, NULL, NEW.hourly_rate, NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_price_history ON pricing_rules;
CREATE TRIGGER trg_log_price_history
AFTER INSERT OR UPDATE OF hourly_rate ON pricing_rules
FOR EACH ROW
EXECUTE FUNCTION fn_log_price_change();

-- Trigger 3: Order status transition validation
CREATE OR REPLACE FUNCTION fn_validate_order_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'placed' AND NEW.status NOT IN ('confirmed', 'advance_paid', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot transition order from "placed" to "%"', NEW.status;
  END IF;
  IF OLD.status = 'advance_paid' AND NEW.status NOT IN ('confirmed', 'shipped', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot transition order from "advance_paid" to "%"', NEW.status;
  END IF;
  IF OLD.status = 'confirmed' AND NEW.status NOT IN ('shipped', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot transition order from "confirmed" to "%"', NEW.status;
  END IF;
  IF OLD.status = 'shipped' AND NEW.status NOT IN ('delivered') THEN
    RAISE EXCEPTION 'Cannot transition order from "shipped" to "%"', NEW.status;
  END IF;
  IF OLD.status = 'delivered' THEN
    RAISE EXCEPTION 'Order in "delivered" status cannot be changed';
  END IF;
  IF OLD.status = 'cancelled' AND NEW.status NOT IN ('placed', 'advance_paid', 'confirmed') THEN
    RAISE EXCEPTION 'Cannot transition order from "cancelled" to "%"', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_status_transition ON orders;
CREATE TRIGGER trg_order_status_transition
BEFORE UPDATE OF status ON orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION fn_validate_order_status_transition();

-- -----------------------------------------------------------------------------
-- 4. Stored Procedures
-- -----------------------------------------------------------------------------

-- Procedure 1: Atomic booking creation and slot allocation
CREATE OR REPLACE PROCEDURE sp_create_booking(
  p_customer_id INT,
  p_slots_json JSONB,
  INOUT p_booking_id INT DEFAULT NULL,
  INOUT p_total_amount NUMERIC DEFAULT NULL
)
AS $$
DECLARE
  v_slot RECORD;
  v_rate NUMERIC(10, 2);
  v_sum NUMERIC(10, 2) := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM customers WHERE user_id = p_customer_id) THEN
    RAISE EXCEPTION 'User % does not have an active Customer role', p_customer_id;
  END IF;

  IF jsonb_array_length(p_slots_json) = 0 THEN
    RAISE EXCEPTION 'At least one slot must be selected to create a booking';
  END IF;

  -- Calculate total amount server-side using fn_get_hourly_rate
  FOR v_slot IN SELECT * FROM jsonb_to_recordset(p_slots_json) AS x(
    field_id INT,
    slot_date DATE,
    start_time TIME,
    end_time TIME
  )
  LOOP
    v_rate := fn_get_hourly_rate(v_slot.field_id, v_slot.slot_date, v_slot.start_time);
    v_sum := v_sum + v_rate;
  END LOOP;

  p_total_amount := v_sum;

  -- Insert booking record
  INSERT INTO bookings (customer_id, total_amount, status, created_at)
  VALUES (p_customer_id, p_total_amount, 'pending', NOW())
  RETURNING booking_id INTO p_booking_id;

  -- Insert slots and linking rows (trigger trg_prevent_double_booking will fire)
  FOR v_slot IN SELECT * FROM jsonb_to_recordset(p_slots_json) AS x(
    field_id INT,
    slot_date DATE,
    start_time TIME,
    end_time TIME
  )
  LOOP
    INSERT INTO slots (field_id, slot_date, start_time, end_time)
    VALUES (v_slot.field_id, v_slot.slot_date, v_slot.start_time, v_slot.end_time)
    ON CONFLICT (field_id, slot_date, start_time) DO NOTHING;

    INSERT INTO booking_slots (booking_id, field_id, slot_date, start_time)
    VALUES (p_booking_id, v_slot.field_id, v_slot.slot_date, v_slot.start_time);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Procedure 2: Atomic payment settlement and validation
-- Fixes Bug 3
CREATE OR REPLACE PROCEDURE sp_record_payment(
  p_user_id INT,
  p_booking_id INT,
  p_order_id INT,
  p_amount NUMERIC,
  p_method VARCHAR,
  p_purpose VARCHAR,
  INOUT p_payment_id INT DEFAULT NULL
)
AS $$
DECLARE
  v_expected_total NUMERIC(10, 2);
  v_current_status VARCHAR;
  v_target_user_id INT;
  v_purpose VARCHAR(50);
BEGIN
  IF (p_booking_id IS NULL AND p_order_id IS NULL) OR
     (p_booking_id IS NOT NULL AND p_order_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Payment must settle either booking_id OR order_id, not both or neither';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  v_purpose := COALESCE(p_purpose, 'full');

  -- Case A: Booking Settlement
  IF p_booking_id IS NOT NULL THEN
    SELECT customer_id, total_amount, status
    INTO v_target_user_id, v_expected_total, v_current_status
    FROM bookings
    WHERE booking_id = p_booking_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Booking #% does not exist', p_booking_id;
    END IF;

    IF v_target_user_id <> p_user_id THEN
      RAISE EXCEPTION 'Unauthorized: Booking does not belong to user #%', p_user_id;
    END IF;

    IF v_current_status = 'cancelled' THEN
      RAISE EXCEPTION 'Cannot settle payment for a cancelled booking';
    END IF;

    IF v_current_status = 'confirmed' AND v_purpose <> 'balance' THEN
      RAISE EXCEPTION 'Booking #% is already paid and confirmed', p_booking_id;
    END IF;

    IF v_purpose = 'full' THEN
      IF p_amount < v_expected_total THEN
        RAISE EXCEPTION 'Insufficient payment: required %, provided %', v_expected_total, p_amount;
      END IF;

      INSERT INTO payments (booking_id, order_id, amount, method, status, purpose, is_advance, created_at)
      VALUES (p_booking_id, NULL, p_amount, COALESCE(p_method, 'card'), 'completed', 'full', FALSE, NOW())
      RETURNING payment_id INTO p_payment_id;

      UPDATE bookings 
      SET status = 'confirmed', payment_method = 'online', advance_amount = p_amount, cash_balance = 0.00 
      WHERE booking_id = p_booking_id;

    ELSIF v_purpose = 'advance' THEN
      IF p_amount >= v_expected_total THEN
        RAISE EXCEPTION 'Advance payment amount must be less than total amount';
      END IF;

      INSERT INTO payments (booking_id, order_id, amount, method, status, purpose, is_advance, created_at)
      VALUES (p_booking_id, NULL, p_amount, COALESCE(p_method, 'card'), 'completed', 'advance', TRUE, NOW())
      RETURNING payment_id INTO p_payment_id;

      UPDATE bookings 
      SET status = 'advance_paid', payment_method = 'cash_advance', advance_amount = p_amount, cash_balance = (v_expected_total - p_amount)
      WHERE booking_id = p_booking_id;

    ELSIF v_purpose = 'balance' THEN
      INSERT INTO payments (booking_id, order_id, amount, method, status, purpose, is_advance, created_at)
      VALUES (p_booking_id, NULL, p_amount, COALESCE(p_method, 'cash'), 'completed', 'balance', FALSE, NOW())
      RETURNING payment_id INTO p_payment_id;

      UPDATE bookings 
      SET status = 'confirmed', cash_balance = 0.00 
      WHERE booking_id = p_booking_id;
    ELSE
      RAISE EXCEPTION 'Invalid payment purpose: %', v_purpose;
    END IF;

  -- Case B: Order Settlement
  ELSE
    SELECT customer_id, total_amount, status
    INTO v_target_user_id, v_expected_total, v_current_status
    FROM orders
    WHERE order_id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Order #% does not exist', p_order_id;
    END IF;

    IF v_target_user_id <> p_user_id THEN
      RAISE EXCEPTION 'Unauthorized: Order does not belong to user #%', p_user_id;
    END IF;

    IF v_current_status = 'cancelled' THEN
      RAISE EXCEPTION 'Cannot settle payment for a cancelled order';
    END IF;

    IF v_purpose = 'full' THEN
      IF p_amount < v_expected_total THEN
        RAISE EXCEPTION 'Insufficient payment: required %, provided %', v_expected_total, p_amount;
      END IF;

      INSERT INTO payments (booking_id, order_id, amount, method, status, purpose, is_advance, created_at)
      VALUES (NULL, p_order_id, p_amount, COALESCE(p_method, 'card'), 'completed', 'full', FALSE, NOW())
      RETURNING payment_id INTO p_payment_id;

      UPDATE orders 
      SET status = 'confirmed', payment_method = 'online', advance_amount = p_amount, cash_balance = 0.00 
      WHERE order_id = p_order_id;

    ELSIF v_purpose = 'advance' THEN
      IF p_amount >= v_expected_total THEN
        RAISE EXCEPTION 'Advance payment amount must be less than total amount';
      END IF;

      INSERT INTO payments (booking_id, order_id, amount, method, status, purpose, is_advance, created_at)
      VALUES (NULL, p_order_id, p_amount, COALESCE(p_method, 'card'), 'completed', 'advance', TRUE, NOW())
      RETURNING payment_id INTO p_payment_id;

      UPDATE orders 
      SET status = 'advance_paid', payment_method = 'cash_advance', advance_amount = p_amount, cash_balance = (v_expected_total - p_amount)
      WHERE order_id = p_order_id;

    ELSIF v_purpose = 'balance' THEN
      INSERT INTO payments (booking_id, order_id, amount, method, status, purpose, is_advance, created_at)
      VALUES (NULL, p_order_id, p_amount, COALESCE(p_method, 'cash'), 'completed', 'balance', FALSE, NOW())
      RETURNING payment_id INTO p_payment_id;

      UPDATE orders 
      SET status = 'delivered', cash_balance = 0.00 
      WHERE order_id = p_order_id;
    ELSE
      RAISE EXCEPTION 'Invalid payment purpose: %', v_purpose;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 7. Platform Operational Settings
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

CREATE TABLE IF NOT EXISTS password_resets (
  reset_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_wishlist (
  wishlist_id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- -----------------------------------------------------------------------------
-- 8. Admin Audit Logs
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

-- -----------------------------------------------------------------------------
-- 9. Common Query Indexes
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_turfs_area ON turfs(area_id);
CREATE INDEX IF NOT EXISTS idx_turfs_active ON turfs(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_slots_field_date ON slots(field_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);