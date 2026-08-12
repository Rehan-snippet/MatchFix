# MatchFix — PERN Stack Template

A working starter implementation of the MatchFix ER Diagram (CSE216 Database
Sessional) using **P**ostgreSQL, **E**xpress, **R**eact, **N**ode.

This is a **template**: the database schema is a complete, exact
translation of the ERD, and the backend/frontend implement the core flows
(auth + roles, turf browsing & booking, marketplace browsing & ordering,
reviews, payments) end-to-end so you have real working code to extend for
your project, rather than an empty scaffold.

```
matchfix-pern/
├── database/
│   ├── schema.sql     # full DDL — every entity/relationship from the ERD
│   └── seed.sql        # sample data for local testing
├── server/             # Express + PostgreSQL API
└── client/             # React (Vite) frontend
```

## 1. Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally (or a connection string to a hosted instance)

## 2. Database setup

```bash
cd server
cp .env.example .env
# edit .env and set DATABASE_URL to your Postgres connection string,
# and JWT_SECRET to any long random string

npm install
npm run db:create   # creates the database if it doesn't exist
npm run db:migrate   # applies database/schema.sql
npm run db:seed      # (optional) loads database/seed.sql sample data
```

If you'd rather do it manually with `psql`:

```bash
createdb matchfix
psql matchfix -f database/schema.sql
psql matchfix -f database/seed.sql   # optional
```

## 3. Run the API

```bash
cd server
npm run dev      # nodemon, http://localhost:5000
# or: npm start
```

Health check: `GET http://localhost:5000/health`

## 4. Run the client

```bash
cd client
npm install
npm run dev       # http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:5000` (see
`client/vite.config.js`), so the React app can just call `/api/...` without
any extra configuration.

## 5. Try it out

Seeded accounts (password for all: `Passw0rd!`):

| Email | Roles |
|---|---|
| naeemul@matchfix.dev | organizer + customer |
| turfrunners@matchfix.dev | organizer |
| gearbazaar@matchfix.dev | seller |
| rafi@matchfix.dev | customer |

Or register a new account from the UI — every new user starts with **no**
role and adds Organizer/Seller/Customer from the Profile page, mirroring the
ERD's overlapping + partial specialization.

## How the ERD maps to the code

| ERD element | Where it lives |
|---|---|
| `User isA {Organizer, Seller, Customer}` (overlapping, partial) | `users`, `organizers`, `sellers`, `customers` tables — subclasses share `user_id` as PK. See `server/src/utils/roles.js` and `POST /api/users/me/roles/:role`. |
| `Area —locatedIn→ Turf —organizes→ Organizer` | `areas`, `turfs` tables; `turfs.controller.js` |
| `Turf —hasPhoto→ Turf_Image` (≤1 cover) | `turf_images` + partial unique index `one_cover_per_turf` |
| `Turf —contains→ Field —pricedBy→ Pricing_Rule —logs→ Price_History —edits→ Organizer` | `fields`, `pricing_rules`, `price_history`; see `fields.controller.js#updatePricingRule` (transactional rate-change logging) |
| `Field —occupies→ Slot` (weak entity, identifying) | `slots` table, composite PK `(field_id, slot_date, start_time)` |
| `Booking —reserves→ Slot`, `Customer —books→ Booking` | `bookings`, `booking_slots`; see `bookings.controller.js#createBooking` (transactional, total participation enforced) |
| `Booking —rates→ Turf_Review` | `turf_reviews` |
| `Payment —settles→ Booking` XOR `—pays→ Order` | `payments` table + `chk_payment_settles_one_target` CHECK constraint |
| `Seller —sells→ Product —shows→ Product_Image` | `products`, `product_images` |
| `Customer —places→ Orders —includes→ Order_Item —listedAs→ Product` (weak entity) | `orders`, `order_items` (composite PK) |
| `Order_Item —rated→ Product_Review` | `product_reviews`, FK to `order_items` composite key |

Design notes the ER notation can't express (see slide "What the Notation
Can't Say") are implemented as CHECK constraints, unique indexes, or
app-layer transaction logic — each one is called out with a comment at the
relevant spot in `database/schema.sql` or the controller that enforces it.

## Known simplifications (documented, not bugs)

- **Slot re-booking after cancellation**: `one_active_booking_per_slot` is a
  plain unique index, so a cancelled booking's slot stays "taken" rather
  than freeing up. Swap it for a trigger that checks `bookings.status <>
  'cancelled'` if you want cancelled slots to reopen.
- **Role changes and JWTs**: adding a role calls `POST /api/auth/refresh`
  from the client to reissue the JWT immediately — without that call,
  role-gated endpoints would only see the new role after the next login.
- **Payment methods** are free-text strings (`card`, `mobile_banking`,
  `cash`, ...) rather than a fixed enum — extend `payments.method` with a
  CHECK constraint if you want to lock it down.
- No file upload — image URLs are entered as plain text/links. Swap in
  S3/Cloudinary upload handling behind the same `POST .../images` endpoints
  if you need real uploads.

## Extending this template

- Add pagination to `listTurfs` / `listProducts` for larger datasets.
- Add an admin role/UI (the ERD's partial specialization already allows a
  plain `User` with no subclass — that's your admin).
- Add refresh-token rotation instead of the simple `/auth/refresh`.
