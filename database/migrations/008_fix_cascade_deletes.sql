-- ============================================================
-- Migration 008: Fix Cascade Deletes for User Subclasses & Associated Records
-- ============================================================

-- 1. Turfs -> Organizers
ALTER TABLE turfs DROP CONSTRAINT IF EXISTS turfs_organizer_id_fkey;
ALTER TABLE turfs ADD CONSTRAINT turfs_organizer_id_fkey 
  FOREIGN KEY (organizer_id) REFERENCES organizers(user_id) ON DELETE CASCADE;

-- 2. Products -> Sellers
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_seller_id_fkey;
ALTER TABLE products ADD CONSTRAINT products_seller_id_fkey 
  FOREIGN KEY (seller_id) REFERENCES sellers(user_id) ON DELETE CASCADE;

-- 3. Bookings -> Customers
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_customer_id_fkey;
ALTER TABLE bookings ADD CONSTRAINT bookings_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES customers(user_id) ON DELETE CASCADE;

-- 4. Orders -> Customers
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;
ALTER TABLE orders ADD CONSTRAINT orders_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES customers(user_id) ON DELETE CASCADE;

-- 5. Price History -> Organizers
ALTER TABLE price_history DROP CONSTRAINT IF EXISTS price_history_organizer_id_fkey;
ALTER TABLE price_history ADD CONSTRAINT price_history_organizer_id_fkey 
  FOREIGN KEY (organizer_id) REFERENCES organizers(user_id) ON DELETE CASCADE;

-- 6. Order Items -> Products
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
ALTER TABLE order_items ADD CONSTRAINT order_items_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE;

-- 7. Add rejection_reason columns to organizers and sellers
ALTER TABLE organizers ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
