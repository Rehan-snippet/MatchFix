-- ============================================================
-- Migration 001: Add Performance Indexes
-- ============================================================

-- Turfs: browsed by area and organizer frequently
CREATE INDEX IF NOT EXISTS idx_turfs_area ON turfs(area_id);
CREATE INDEX IF NOT EXISTS idx_turfs_organizer ON turfs(organizer_id);

-- Bookings: listed by customer frequently
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id, created_at DESC);

-- Booking slots: joined in trigger and availability checks
CREATE INDEX IF NOT EXISTS idx_booking_slots_field_date ON booking_slots(field_id, slot_date, start_time);

-- Orders: listed by customer and by seller's products
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Payments: looked up by booking or order
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id) WHERE order_id IS NOT NULL;

-- Products: filtered by category/seller
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Pricing rules: looked up by fn_get_hourly_rate()
CREATE INDEX IF NOT EXISTS idx_pricing_rules_field ON pricing_rules(field_id, day_of_week);
