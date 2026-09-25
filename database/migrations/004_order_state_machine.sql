-- ============================================================
-- Migration 004: Order status transition validation
-- ============================================================

CREATE OR REPLACE FUNCTION fn_validate_order_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'placed' AND NEW.status NOT IN ('confirmed', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot transition order from "placed" to "%"', NEW.status;
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

DROP TRIGGER IF EXISTS trg_order_status_transition ON orders;
CREATE TRIGGER trg_order_status_transition
BEFORE UPDATE OF status ON orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION fn_validate_order_status_transition();
