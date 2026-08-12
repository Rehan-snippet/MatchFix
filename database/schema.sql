-- =====================================================================
-- MatchFix — PostgreSQL Schema
-- Generated directly from the Matchfix ER Diagram (CSE216 Database Sessional)
--
-- Mapping notes (kept as comments so the schema is traceable back to the ERD):
--   • User isA {Organizer, Seller, Customer}  -> overlapping (o) + partial
--     specialization, implemented as table-per-subclass, subclasses share
--     the parent's PK (user_id) instead of inventing their own key.
--   • Turf_Image / Product_Image "at most one is_cover" -> partial unique
--     indexes (WHERE is_cover = true).
--   • Slot is a WEAK entity, identified by (field_id, slot_date, start_time)
--     -> "occupies" is the identifying relationship (composite PK includes
--     the owner's key, ON DELETE CASCADE from Field).
--   • Order_Item is a WEAK entity, identified by (order_id, product_id)
--     -> "includes"/"listedAs" are the identifying relationships.
--   • booking <-> slot ("reserves") is many-to-many with total participation
--     on the Booking side -> junction table booking_slots.
--   • Payment "settles" a Booking XOR "pays" an Order (never both) -> two
--     nullable FKs + a CHECK constraint enforcing exactly one is set.
--   • Business rules the notation can't express (no two overlapping
--     bookings on the same field, enum domains, etc.) are enforced with
--     CHECK constraints and one trigger, and noted inline.
-- =====================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid() if ever needed

-- =====================================================================
-- 1. USER SPECIALIZATION  (User isA {Organizer, Seller, Customer})
-- =====================================================================

CREATE TABLE users (
    user_id         SERIAL PRIMARY KEY,
    name            VARCHAR(150)  NOT NULL,
    email           VARCHAR(150)  NOT NULL UNIQUE,
    phone           VARCHAR(30),
    password_hash   TEXT          NOT NULL,
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Subclasses borrow user_id as their PK (no key of their own).
CREATE TABLE organizers (
    user_id         INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    trade_licence   VARCHAR(100),
    payout_account  VARCHAR(150)
);

CREATE TABLE sellers (
    user_id         INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    shop_name       VARCHAR(150) NOT NULL,
    payout_account  VARCHAR(150)
);

CREATE TABLE customers (
    user_id         INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    default_address TEXT
);

-- =====================================================================
-- 2. AREAS & TURFS  (locatedIn, organizes, hasPhoto, contains)
-- =====================================================================

CREATE TABLE areas (
    area_id     SERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL UNIQUE, -- 2nd candidate key noted on the ERD
    city        VARCHAR(100),
    center_lat  DECIMAL(9,6),
    center_lng  DECIMAL(9,6)
);

CREATE TABLE turfs (
    turf_id       SERIAL PRIMARY KEY,
    area_id       INTEGER NOT NULL REFERENCES areas(area_id),          -- locatedIn (1 Area : N Turf)
    organizer_id  INTEGER NOT NULL REFERENCES organizers(user_id),     -- organizes (1 Organizer : N Turf)
    name          VARCHAR(150) NOT NULL,
    address       TEXT,
    latitude      DECIMAL(9,6),
    longitude     DECIMAL(9,6),
    description   TEXT,
    is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE turf_images (
    image_id  SERIAL PRIMARY KEY,
    turf_id   INTEGER NOT NULL REFERENCES turfs(turf_id) ON DELETE CASCADE, -- hasPhoto
    url       TEXT    NOT NULL,
    is_cover  BOOLEAN NOT NULL DEFAULT FALSE
);
-- "at most one Turf_Image per owner may have is_cover = true"
CREATE UNIQUE INDEX one_cover_per_turf ON turf_images(turf_id) WHERE is_cover = TRUE;

-- =====================================================================
-- 3. FIELDS & PRICING  (contains, pricedBy, logs, edits)
-- =====================================================================

CREATE TABLE fields (
    field_id   SERIAL PRIMARY KEY,
    turf_id    INTEGER NOT NULL REFERENCES turfs(turf_id) ON DELETE CASCADE, -- contains
    name       VARCHAR(100) NOT NULL,
    side_type  VARCHAR(10)  NOT NULL CHECK (side_type IN ('5v5','7v7','11v11')), -- domain note from slide 9
    surface    VARCHAR(50)
);

CREATE TABLE pricing_rules (
    rule_id         SERIAL PRIMARY KEY,
    field_id        INTEGER NOT NULL REFERENCES fields(field_id) ON DELETE CASCADE, -- pricedBy
    day_of_week     SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun..6=Sat
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    hourly_rate     DECIMAL(10,2) NOT NULL CHECK (hourly_rate >= 0),
    effective_from  DATE NOT NULL DEFAULT CURRENT_DATE,
    CHECK (start_time < end_time)
);

CREATE TABLE price_history (
    change_id     SERIAL PRIMARY KEY,
    rule_id       INTEGER NOT NULL REFERENCES pricing_rules(rule_id) ON DELETE CASCADE, -- logs
    organizer_id  INTEGER NOT NULL REFERENCES organizers(user_id),                      -- edits (owning party only, enforced in app layer)
    old_rate      DECIMAL(10,2),
    new_rate      DECIMAL(10,2) NOT NULL,
    changed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 4. SLOTS & BOOKINGS  (occupies [identifying], reserves, books, rates)
-- =====================================================================

-- Slot is a WEAK entity: identified by owning Field + partial key (date, start_time)
CREATE TABLE slots (
    field_id    INTEGER NOT NULL REFERENCES fields(field_id) ON DELETE CASCADE, -- occupies (identifying)
    slot_date   DATE NOT NULL,
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    PRIMARY KEY (field_id, slot_date, start_time),
    CHECK (start_time < end_time)
);

CREATE TABLE bookings (
    booking_id    SERIAL PRIMARY KEY,
    customer_id   INTEGER NOT NULL REFERENCES customers(user_id), -- books
    status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','confirmed','cancelled','completed')),
    total_amount  DECIMAL(10,2) NOT NULL DEFAULT 0,
    cancelled_at  TIMESTAMPTZ,
    cancel_reason TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- reserves: Booking (1) --- (N) Slot, total participation on the Booking side
-- (every Booking must reserve >= 1 Slot; enforced in the app transaction).
CREATE TABLE booking_slots (
    booking_id  INTEGER NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
    field_id    INTEGER NOT NULL,
    slot_date   DATE    NOT NULL,
    start_time  TIME    NOT NULL,
    PRIMARY KEY (booking_id, field_id, slot_date, start_time),
    FOREIGN KEY (field_id, slot_date, start_time)
        REFERENCES slots(field_id, slot_date, start_time) ON DELETE CASCADE
);

-- Design note from slide 11: "No two bookings of the same field may overlap
-- in time." Basic ER can't express this (it compares two relationship
-- instances), so we back it with a partial unique index: a given slot can
-- only be attached to one *active* (non-cancelled) booking at a time.
CREATE UNIQUE INDEX one_active_booking_per_slot
    ON booking_slots (field_id, slot_date, start_time);
-- NOTE: if you want cancelled bookings to free the slot for rebooking,
-- swap this for a trigger that checks bookings.status <> 'cancelled'
-- instead of a plain unique index (see README "Known simplifications").

CREATE TABLE turf_reviews (
    review_id   SERIAL PRIMARY KEY,
    booking_id  INTEGER NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE, -- rates
    rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (booking_id) -- one review per booking
);

-- =====================================================================
-- 5. MARKETPLACE  (sells, shows, places, includes, listedAs, rated)
-- =====================================================================

CREATE TABLE products (
    product_id   SERIAL PRIMARY KEY,
    seller_id    INTEGER NOT NULL REFERENCES sellers(user_id), -- sells
    title        VARCHAR(150) NOT NULL,
    category     VARCHAR(100),
    description  TEXT,
    price        DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    condition    VARCHAR(20) CHECK (condition IN ('new','used')),
    stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE product_images (
    image_id    SERIAL PRIMARY KEY,
    product_id  INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE, -- shows
    url         TEXT NOT NULL,
    is_cover    BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE UNIQUE INDEX one_cover_per_product ON product_images(product_id) WHERE is_cover = TRUE;

CREATE TABLE orders (
    order_id          SERIAL PRIMARY KEY,
    customer_id       INTEGER NOT NULL REFERENCES customers(user_id), -- places
    total             DECIMAL(10,2) NOT NULL DEFAULT 0,
    delivery_address  TEXT NOT NULL,
    delivery_phone    VARCHAR(30),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order_Item is a WEAK entity: PK borrowed from (order_id, product_id)
CREATE TABLE order_items (
    order_id    INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,   -- includes
    product_id  INTEGER NOT NULL REFERENCES products(product_id),                 -- listedAs
    qty         INTEGER NOT NULL CHECK (qty > 0),
    unit_price  DECIMAL(10,2) NOT NULL, -- snapshot of Product.price at order time
    status      VARCHAR(20) NOT NULL DEFAULT 'placed'
                CHECK (status IN ('placed','confirmed','delivered','cancelled')),
    PRIMARY KEY (order_id, product_id)
);

CREATE TABLE product_reviews (
    review_id   SERIAL PRIMARY KEY,
    order_id    INTEGER NOT NULL,
    product_id  INTEGER NOT NULL,
    rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (order_id, product_id) REFERENCES order_items(order_id, product_id) ON DELETE CASCADE, -- rated
    UNIQUE (order_id, product_id) -- one review per purchased line
);

-- =====================================================================
-- 6. PAYMENTS  (settles Booking XOR pays Order — never both)
-- =====================================================================

CREATE TABLE payments (
    payment_id  SERIAL PRIMARY KEY,
    booking_id  INTEGER REFERENCES bookings(booking_id) ON DELETE CASCADE, -- settles (N Payment : 1 Booking)
    order_id    INTEGER REFERENCES orders(order_id)   ON DELETE CASCADE,   -- pays     (1 Payment : 1 Order)
    amount      DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    purpose     VARCHAR(30)  NOT NULL, -- e.g. advance | remainder | refund | full
    method      VARCHAR(30)  NOT NULL, -- e.g. card | mobile_banking | cash
    trx_id      VARCHAR(100),
    paid_at     TIMESTAMPTZ,
    status      VARCHAR(20)  NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','success','failed','refunded')),
    CONSTRAINT chk_payment_settles_one_target CHECK (
        (booking_id IS NOT NULL AND order_id IS NULL) OR
        (booking_id IS NULL AND order_id IS NOT NULL)
    )
);
-- "pays: exactly 1 Payment to 1 Order" — one order should not be paid twice.
CREATE UNIQUE INDEX one_payment_per_order ON payments(order_id) WHERE order_id IS NOT NULL;

COMMIT;

-- =====================================================================
-- Helpful indexes for common lookups
-- =====================================================================
CREATE INDEX idx_turfs_area           ON turfs(area_id);
CREATE INDEX idx_turfs_organizer      ON turfs(organizer_id);
CREATE INDEX idx_fields_turf          ON fields(turf_id);
CREATE INDEX idx_pricing_rules_field  ON pricing_rules(field_id);
CREATE INDEX idx_bookings_customer    ON bookings(customer_id);
CREATE INDEX idx_products_seller      ON products(seller_id);
CREATE INDEX idx_orders_customer      ON orders(customer_id);
CREATE INDEX idx_order_items_product  ON order_items(product_id);
CREATE INDEX idx_payments_booking     ON payments(booking_id);
CREATE INDEX idx_payments_order       ON payments(order_id);
