-- =====================================================================
-- MatchFix — sample seed data
-- Password for every seeded user is: Passw0rd!
-- (bcrypt hash below is a real, pre-computed hash — verified to match
-- "Passw0rd!" — so you don't need the API running to seed data)
-- =====================================================================

BEGIN;

-- Passw0rd!  ->  bcrypt, 10 rounds
INSERT INTO users (name, email, phone, password_hash) VALUES
  ('Naeemul Haque',  'naeemul@matchfix.dev', '01700000001', '$2b$10$speT22nGoWSS.pzZBalc6.Zda3pwvUJ96cSVjSHVX7T6LHOK1r9ra'),
  ('Nahid Rajon',     'nahid@matchfix.dev',   '01700000002', '$2b$10$speT22nGoWSS.pzZBalc6.Zda3pwvUJ96cSVjSHVX7T6LHOK1r9ra'),
  ('Turf Runners Ltd','turfrunners@matchfix.dev','01700000003', '$2b$10$speT22nGoWSS.pzZBalc6.Zda3pwvUJ96cSVjSHVX7T6LHOK1r9ra'),
  ('Gear Bazaar',     'gearbazaar@matchfix.dev','01700000004', '$2b$10$speT22nGoWSS.pzZBalc6.Zda3pwvUJ96cSVjSHVX7T6LHOK1r9ra'),
  ('Rafi Chowdhury',  'rafi@matchfix.dev',    '01700000005', '$2b$10$speT22nGoWSS.pzZBalc6.Zda3pwvUJ96cSVjSHVX7T6LHOK1r9ra');

-- user 3 = organizer, user 4 = seller, user 5 = customer, user 1 = organizer+customer (overlapping)
INSERT INTO organizers (user_id, trade_licence, payout_account) VALUES
  (1, 'TL-2026-0011', 'bkash:01700000001'),
  (3, 'TL-2026-0042', 'bkash:01700000003');

INSERT INTO sellers (user_id, shop_name, payout_account) VALUES
  (4, 'Gear Bazaar', 'nagad:01700000004');

INSERT INTO customers (user_id, default_address) VALUES
  (1, 'House 12, Road 5, Dhanmondi, Dhaka'),
  (5, 'Flat 3B, Bashundhara R/A, Dhaka');

INSERT INTO areas (name, city, center_lat, center_lng) VALUES
  ('Dhanmondi',    'Dhaka', 23.746500, 90.376000),
  ('Bashundhara',  'Dhaka', 23.816000, 90.434000);

INSERT INTO turfs (area_id, organizer_id, name, address, latitude, longitude, description) VALUES
  (1, 1, 'Greenline Turf Arena',   'Road 5, Dhanmondi, Dhaka',   23.746600, 90.376200, 'Floodlit 5-a-side turf with locker rooms.'),
  (2, 3, 'Bashundhara Sports Hub', 'Block C, Bashundhara, Dhaka',23.816200, 90.434200, 'Two full-size pitches, parking available.');

INSERT INTO turf_images (turf_id, url, is_cover) VALUES
  (1, 'https://picsum.photos/seed/turf1a/800/500', TRUE),
  (1, 'https://picsum.photos/seed/turf1b/800/500', FALSE),
  (2, 'https://picsum.photos/seed/turf2a/800/500', TRUE);

INSERT INTO fields (turf_id, name, side_type, surface) VALUES
  (1, 'Field A', '5v5',  'Artificial Turf'),
  (1, 'Field B', '7v7',  'Artificial Turf'),
  (2, 'Pitch 1', '11v11','Natural Grass');

INSERT INTO pricing_rules (field_id, day_of_week, start_time, end_time, hourly_rate) VALUES
  (1, 6, '16:00', '22:00', 1200.00), -- Saturday evening
  (1, 0, '16:00', '22:00', 1200.00), -- Sunday evening
  (2, 5, '06:00', '10:00',  800.00), -- Friday morning
  (3, 6, '16:00', '22:00', 2500.00);

INSERT INTO price_history (rule_id, field_id, old_rate, new_rate) VALUES
  (1, 1, 1000.00, 1200.00);

INSERT INTO slots (field_id, slot_date, start_time, end_time) VALUES
  (1, CURRENT_DATE + 2, '16:00', '17:00'),
  (1, CURRENT_DATE + 2, '17:00', '18:00'),
  (1, CURRENT_DATE + 2, '18:00', '19:00'),
  (3, CURRENT_DATE + 3, '16:00', '17:00'),
  (3, CURRENT_DATE + 3, '17:00', '18:00');

INSERT INTO products (seller_id, title, category, description, price, condition, stock) VALUES
  (4, 'Nike Mercurial Vapor 15', 'Boots',   'Firm ground football boots, size 42.', 8500.00, 'new', 12),
  (4, 'Adidas Match Ball',       'Balls',   'FIFA quality pro match ball.',          3200.00, 'new', 30),
  (4, 'Goalkeeper Gloves - Pro', 'Gloves',  'Latex palm, size 9.',                   2200.00, 'used', 5);

INSERT INTO product_images (product_id, url, is_cover) VALUES
  (1, 'https://picsum.photos/seed/prod1/800/500', TRUE),
  (2, 'https://picsum.photos/seed/prod2/800/500', TRUE),
  (3, 'https://picsum.photos/seed/prod3/800/500', TRUE);

COMMIT;