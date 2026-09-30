-- ============================================================
-- Migration 009: Cash Payment with Online Advance Option
-- ============================================================

-- 1. Update bookings table constraints and columns
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('pending', 'advance_paid', 'confirmed', 'completed', 'cancelled'));

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) NOT NULL DEFAULT 'online';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS advance_amount NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cash_balance NUMERIC(10, 2) DEFAULT 0.00;

-- 2. Update orders table constraints and columns
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('placed', 'advance_paid', 'confirmed', 'shipped', 'delivered', 'cancelled'));

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30) NOT NULL DEFAULT 'online';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS advance_amount NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cash_balance NUMERIC(10, 2) DEFAULT 0.00;

-- 3. Update order_items status constraint if exists
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_status_check;
ALTER TABLE order_items ADD CONSTRAINT order_items_status_check
  CHECK (status IN ('placed', 'advance_paid', 'confirmed', 'shipped', 'delivered', 'cancelled'));

-- Update order status transition state machine function to support advance_paid
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
  IF OLD.status IN ('delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Order in "%" status cannot be changed', OLD.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Update payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS is_advance BOOLEAN NOT NULL DEFAULT FALSE;
DROP INDEX IF EXISTS one_payment_per_order;
DROP INDEX IF EXISTS one_payment_per_booking;

-- 5. Update payment_intents table
ALTER TABLE payment_intents ADD COLUMN IF NOT EXISTS purpose VARCHAR(50) NOT NULL DEFAULT 'full';

-- 6. Update stored procedure sp_record_payment to support advance and balance settlements
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
