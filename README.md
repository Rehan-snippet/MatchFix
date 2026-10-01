# ⚽ MatchFix — Sports Arena Booking & Football Marketplace

MatchFix is a full-featured, enterprise-grade **PERN stack** (PostgreSQL, Express.js, React, Node.js) web platform tailored for the Bangladeshi sports ecosystem. It unifies football turf discovery and hourly pitch reservations with a multi-vendor sports gear marketplace, role-based governance, dynamic peak-hour pricing, double-booking prevention, cash advance settlement, and an interactive administrative command center.

---

## 📑 Table of Contents

- [🌟 Key Highlights & Architecture](#-key-highlights--architecture)
- [🛠️ Tech Stack](#️-tech-stack)
- [📂 Directory Structure](#-directory-structure)
- [🚀 Quick Start & Initialization](#-quick-start--initialization)
  - [Prerequisites](#prerequisites)
  - [Step 1: Clone & Install Dependencies](#step-1-clone--install-dependencies)
  - [Step 2: Environment Configuration](#step-2-environment-configuration)
  - [Step 3: Database Provisioning & Migration](#step-3-database-provisioning--migration)
  - [Step 4: Seed Sample Data](#step-4-seed-sample-data)
  - [Step 5: Admin Provisioning](#step-5-admin-provisioning)
  - [Step 6: Launch Applications](#step-6-launch-applications)
  - [Seeded Demo Accounts](#seeded-demo-accounts)
- [💻 Command Reference](#-command-reference)
  - [Backend Commands (`server/`)](#backend-commands-server)
  - [Frontend Commands (`client/`)](#frontend-commands-client)
- [🎯 Features & User Guide](#-features--user-guide)
  - [1. Customer / Player Experience](#1-customer--player-experience)
  - [2. Turf Organizer Dashboard](#2-turf-organizer-dashboard)
  - [3. Sports Gear Seller Dashboard](#3-sports-gear-seller-dashboard)
  - [4. Platform Administrator Command Center](#4-platform-administrator-command-center)
- [🔄 Event & Operational Workflows](#-event--operational-workflows)
  - [Workflow 1: User Onboarding & Role Approval](#workflow-1-user-onboarding--role-approval)
  - [Workflow 2: Turf Setup, Pitch Configuration & Slot Generation](#workflow-2-turf-setup-pitch-configuration--slot-generation)
  - [Workflow 3: Pitch Reservation & Payment Settlement](#workflow-3-pitch-reservation--payment-settlement)
  - [Workflow 4: Marketplace Order Lifecycle & Delivery](#workflow-4-marketplace-order-lifecycle--delivery)
  - [Workflow 5: Verified Reviews & Feedback](#workflow-5-verified-reviews--feedback)
  - [Workflow 6: System Configuration & Security Audit Trail](#workflow-6-system-configuration--security-audit-trail)
- [🛡️ Database Integrity & Stored Logic](#️-database-integrity--stored-logic)
- [🧪 Testing & Verification](#-testing--verification)

---

## 🌟 Key Highlights & Architecture

- **True Overlapping Multi-Role Specialization**: Users maintain a unified login while dynamically assuming one or more roles (`Customer`, `Organizer`, `Seller`, `Admin`) via table-per-subclass inheritance sharing `user_id` as primary key.
- **Zero Double-Booking Guarantee**: Enforced at the database engine level via PostgreSQL trigger (`trg_prevent_double_booking`) before slot reservation rows are committed.
- **Dynamic Pricing Engine**: Granular day-of-week and time-window rates calculated on-the-fly via stored function `fn_get_hourly_rate()`, automatically recording rate adjustments into `price_history`.
- **Hybrid Payment Architecture**: Full online payment or 20% advance settlement with remaining balance collected at venue / Cash on Delivery (COD), supported by an interactive sandbox payment gateway simulator.
- **Interactive GIS Mapping**: OpenStreetMap integration via Leaflet allowing turf organizers to click-to-pin arena coordinates and customers to visually discover nearby arenas across Dhaka.
- **Operational Audit Trail**: Immutable logging of all administrative approvals, modifications, and financial reconciliations in `admin_audit_logs`.

---

## 🛠️ Tech Stack

### Backend
| Technology | Description |
|---|---|
| **Node.js (v18+)** | Asynchronous JavaScript runtime environment |
| **Express.js (v4.19)** | Fast, unopinionated REST API framework |
| **PostgreSQL (v14+)** | Enterprise relational database with triggers, stored procedures, and JSONB support |
| **pg (node-postgres v8.12)** | Production-ready connection pooling and client driver |
| **JSON Web Tokens (`jsonwebtoken` v9.0)** | Stateless authentication with role payload encoding |
| **`bcryptjs` (v2.4)** | Adaptive cryptographic password hashing |
| **`multer` (v2.4)** | Multipart form-data handling for photo uploads |
| **`helmet` & `cors`** | HTTP header security hardening and cross-origin resource sharing |
| **`express-rate-limit`** | Brute-force and API endpoint throttling |
| **`morgan`** | HTTP request logging for development and debugging |

### Frontend
| Technology | Description |
|---|---|
| **React 18** | Declarative component UI library using hooks and Context API |
| **Vite 5** | Next-generation frontend tooling with instant Hot Module Replacement (HMR) |
| **Tailwind CSS 4** | Modern utility-first CSS framework with dynamic responsive design |
| **React Router DOM (v6.26)** | Client-side routing, protected routes, and role-based route guards |
| **Leaflet & React-Leaflet (v1.9)** | Interactive map visualization and coordinate geolocation picker |
| **Lucide React** | Clean, accessible SVG iconography |
| **Axios (v1.7)** | Promise-based HTTP client with automatic JWT bearer authorization interceptor |

---

## 📂 Directory Structure

```
MatchFix/
├── database/
│   └── schema.sql                 # Master PostgreSQL DDL: 18 tables, 3 triggers, 2 functions, 2 procedures
├── server/
│   ├── package.json               # Backend dependencies and orchestration scripts
│   ├── server.js                  # Express app entry point, middleware, static uploads, and router mount
│   ├── .env.example               # Environment template for server configuration
│   ├── scripts/
│   │   ├── createDb.js            # Automated database creation utility
│   │   ├── migrate.js             # DDL migration runner for schema.sql
│   │   ├── seed.js                # Master database seeder with authentic Dhaka test data
│   │   ├── resetDb.js             # Atomic database wipe, recreate, migration, and re-seed
│   │   ├── createAdmin.js         # CLI tool to promote existing users or provision new Admins
│   │   ├── check_fks.js           # Foreign key integrity validator
│   │   └── test_all_pages_e2e.js  # Automated end-to-end integration and API verification test suite
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # PostgreSQL pg.Pool connection singleton with error hooks
│   │   ├── controllers/           # API request handlers and business logic
│   │   │   ├── admin.controller.js     # Governance, approvals, KPIs, settings, audit logs
│   │   │   ├── areas.controller.js     # Dhaka coverage zones management
│   │   │   ├── auth.controller.js      # Register, login, token refresh, password resets
│   │   │   ├── bookings.controller.js  # Pitch reservations, cancellations, cash collection
│   │   │   ├── fields.controller.js    # Pitches, 5v5/7v7/11v11 configurations, pricing rules
│   │   │   ├── orders.controller.js    # Marketplace orders, item dispatch, COD reconciliation
│   │   │   ├── payments.controller.js  # Intent initialization, sandbox gateway, settlement
│   │   │   ├── products.controller.js  # Store catalog, stock tracking, verified reviews
│   │   │   ├── settings.controller.js  # Public platform configuration and broadcast banners
│   │   │   ├── slots.controller.js     # Bulk slot generator, schedule viewer, slot toggle
│   │   │   ├── turfs.controller.js     # Arena listings, geo-coords, photo uploads
│   │   │   └── users.controller.js     # User profile, role onboarding, wishlist
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verification and requireRole/requireAdmin guards
│   │   │   ├── errorHandler.js    # Standardized JSON error response handler & 404 catcher
│   │   │   ├── rateLimiter.js     # Request rate limiting configuration
│   │   │   └── upload.js          # Multer storage configuration for turfs and products media
│   │   ├── routes/                # Modular Express routers mounted under /api
│   │   └── utils/
│   │       ├── ApiError.js        # Custom error class with HTTP status codes
│   │       ├── asyncHandler.js    # Async wrapper catching unhandled promise rejections
│   │       ├── auditLogger.js     # Utility logging admin actions into admin_audit_logs
│   │       ├── authPayload.js     # Token payload constructor embedding active roles
│   │       └── validators.js      # Input sanitation and field validation helpers
│   └── uploads/                   # Statically served local file storage (/uploads)
│       ├── products/              # Uploaded marketplace product images
│       └── turfs/                 # Uploaded turf arena photos
├── client/
│   ├── package.json               # Frontend dependencies and Vite scripts
│   ├── vite.config.js             # Vite configuration with /api proxy to localhost:5000
│   ├── .env.example               # Frontend environment template
│   ├── index.html                 # Single-page application HTML container
│   └── src/
│       ├── App.jsx                # Main route registry with role-guarded views
│       ├── main.jsx               # React DOM entry point wrapping Auth & Cart providers
│       ├── api/
│       │   └── client.js          # Pre-configured Axios instance with auth token injection
│       ├── context/
│       │   ├── AuthContext.jsx    # User authentication state, token persistence, role helpers
│       │   └── CartContext.jsx    # Persistent shopping cart state, items, quantities, totals
│       ├── components/            # Reusable UI widgets
│       │   ├── BroadcastBanner.jsx    # Global platform announcement banner
│       │   ├── CategoryBar.jsx        # Marketplace category navigation tabs
│       │   ├── FilterModal.jsx        # Turf search filters (area, price, surface)
│       │   ├── LocationPickerMap.jsx  # Interactive click-to-pin Leaflet map for organizers
│       │   ├── Navbar.jsx             # Responsive navigation with role indicators & cart badge
│       │   ├── ProtectedRoute.jsx     # Route guard enforcing authentication and role permissions
│       │   ├── SandboxPaymentModal.jsx# Simulated payment gateway modal (bKash/Nagad/Cards)
│       │   ├── SearchCapsule.jsx      # Global search bar widget
│       │   ├── TurfCard.jsx           # Turf display card with pricing and rating badge
│       │   └── TurfMap.jsx            # Interactive Leaflet map displaying all arena pins
│       ├── pages/                 # Full-page application views
│       │   ├── AdminDashboard.jsx     # Administrative oversight, approvals, KPIs, audit log
│       │   ├── Cart.jsx               # Shopping cart & checkout with advance payment option
│       │   ├── ForgotPassword.jsx     # Password reset request page
│       │   ├── Home.jsx               # Landing page with hero, search, turfs, and gear
│       │   ├── Login.jsx              # User sign-in
│       │   ├── Marketplace.jsx        # Sports gear catalog with search, category & price filters
│       │   ├── MyBookings.jsx         # Customer pitch reservations with review & cancel modals
│       │   ├── MyOrders.jsx           # Customer product orders with tracking & review modals
│       │   ├── NotFound.jsx           # Clean 404 page
│       │   ├── OrganizerDashboard.jsx # Turf & pitch setup, pricing rules, schedule, bookings
│       │   ├── ProductDetail.jsx      # Product showcase, stock, reviews, Add to Cart
│       │   ├── Profile.jsx            # Account details, password change, role claiming
│       │   ├── Register.jsx           # New user registration
│       │   ├── ResetPassword.jsx      # Token-based password reset form
│       │   ├── SellerDashboard.jsx    # Inventory manager, product creation, order dispatch
│       │   ├── TurfDetail.jsx         # Turf photos, pitch slots grid, booking modal
│       │   ├── Turfs.jsx              # Arena discovery with filters and map toggle
│       │   └── Wishlist.jsx           # Saved favorite products
│       └── utils/
│           ├── exportCsv.js       # Client-side tabular data export to CSV
│           ├── imageUrl.js        # Resolves local backend upload paths vs external URLs
│           └── validators.js      # Frontend form validation helpers
├── .gitignore
├── plan.md                        # Architectural roadmap and implementation history
├── README.md                      # Comprehensive project documentation
└── SETUP.md                       # Quick teammate onboarding guide
```

---

## 🚀 Quick Start & Initialization

Follow these step-by-step instructions to get MatchFix running locally on your machine.

### Prerequisites

- **Node.js**: `v18.0.0` or higher ([Download Node.js](https://nodejs.org/))
- **PostgreSQL**: `v14.0` or higher running locally ([Download PostgreSQL](https://www.postgresql.org/))
- **npm**: Comes bundled with Node.js (`npm -v`)

---

### Step 1: Clone & Install Dependencies

Open your terminal or PowerShell and clone the repository:

```powershell
git clone https://github.com/Rehan-snippet/MatchFix.git
cd MatchFix
```

Install backend dependencies:
```powershell
cd server
npm install
```

Install frontend dependencies:
```powershell
cd ..\client
npm install
cd ..
```

---

### Step 2: Environment Configuration

Create the `.env` configuration files for both server and client:

#### 1. Server Configuration (`server/.env`)
Copy the sample file:
```powershell
Copy-Item server\.env.example server\.env
```
Open `server\.env` and configure your credentials:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/matchfix
JWT_SECRET=super_secret_jwt_key_matchfix_platform_2026_secure
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```
> [!IMPORTANT]
> Replace `YOUR_POSTGRES_PASSWORD` with your local PostgreSQL `postgres` user password.

#### 2. Client Configuration (`client/.env`)
Copy the sample file:
```powershell
Copy-Item client\.env.example client\.env
```
Default contents (Vite proxies requests to `http://localhost:5000` automatically):
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

### Step 3: Database Provisioning & Migration

Ensure PostgreSQL is running on your machine, then run:

```powershell
cd server
npm run db:create    # Connects to Postgres and creates the "matchfix" database if missing
npm run db:migrate   # Applies database/schema.sql (tables, triggers, functions, procedures)
```

---

### Step 4: Seed Sample Data

Populate the database with authentic test accounts, Dhaka coverage zones, football turfs with photos, pitches, hourly slots, sports gear catalog, and live orders:

```powershell
npm run db:seed
```

> [!TIP]
> You can wipe the database clean, re-run all migrations, and re-seed at any time with a single command:
> ```powershell
> npm run db:reset
> ```

---

### Step 5: Admin Provisioning

The database seeder automatically creates an administrator account (`admin@matchfix.dev`). If you want to promote an existing user or create a custom admin via the CLI:

```powershell
# Promote an existing user:
node scripts/createAdmin.js customer.tanvir@matchfix.dev

# Or create a brand new admin:
node scripts/createAdmin.js customadmin@matchfix.dev Passw0rd! "System Admin" 01711000999
```

---

### Step 6: Launch Applications

Run the backend and frontend in two separate terminal windows:

#### Terminal 1 — Backend API
```powershell
cd server
npm run dev
```
*API will start listening at: `http://localhost:5000`*

#### Terminal 2 — Frontend Client
```powershell
cd client
npm run dev
```
*Vite web application will launch at: `http://localhost:5173`*

Open **`http://localhost:5173`** in your browser to access MatchFix.

---

### Seeded Demo Accounts

All pre-seeded test accounts share the universal password: **`Passw0rd!`**

| Role | Email | Password | Details |
|---|---|---|---|
| **Platform Admin** | `admin@matchfix.dev` | `Passw0rd!` | Full governance, approvals, KPIs, audit logs |
| **Platform Admin** | `admin.haque@matchfix.dev` | `Passw0rd!` | Co-administrator |
| **Turf Organizer** | `organizer.jaff@matchfix.dev` | `Passw0rd!` | Manages *Jaff Arena Bashundhara* (5v5 & 7v7) |
| **Turf Organizer** | `organizer.kickoff@matchfix.dev` | `Passw0rd!` | Manages *Kickoff Arena Banani* |
| **Turf Organizer** | `organizer.greenline@matchfix.dev`| `Passw0rd!` | Manages *Green Line Arena Dhanmondi* |
| **Turf Organizer** | `organizer.pending@matchfix.dev`  | `Passw0rd!` | Pending admin verification |
| **Gear Seller** | `seller.boots@matchfix.dev` | `Passw0rd!` | Manages *Dhaka Boot Room* |
| **Gear Seller** | `seller.kits@matchfix.dev` | `Passw0rd!` | Manages *Jersey Freak BD* |
| **Gear Seller** | `seller.gear@matchfix.dev` | `Passw0rd!` | Manages *Pro Kickers Gear* |
| **Gear Seller** | `seller.pending@matchfix.dev` | `Passw0rd!` | Pending shop approval |
| **Customer** | `customer.tanvir@matchfix.dev` | `Passw0rd!` | Active bookings & marketplace order history |
| **Customer** | `customer.rafi@matchfix.dev` | `Passw0rd!` | Active bookings in Bashundhara |
| **Customer** | `customer.mehedi@matchfix.dev` | `Passw0rd!` | Active wishlist and orders |

---

## 💻 Command Reference

### Backend Commands (`server/`)

Run all backend commands inside the `server/` directory:

| Command | Action | Description |
|---|---|---|
| `npm run dev` | **Start Dev Server** | Launches Express with `nodemon` on `http://localhost:5000` with hot-reloading on file edits. |
| `npm start` | **Start Production** | Launches Express in standard Node.js runtime. |
| `npm run db:create` | **Create Database** | Connects to PostgreSQL server and executes `CREATE DATABASE matchfix` if not present. |
| `npm run db:migrate` | **Apply Migrations** | Executes `database/schema.sql` to construct tables, foreign keys, triggers, and stored procedures. |
| `npm run db:seed` | **Seed Data** | Populates Dhaka areas, turfs, pitches, pricing rules, slots, products, orders, reviews, and test users. |
| `npm run db:reset` | **Atomic DB Reset** | Forces disconnection of active clients, drops `matchfix`, recreates it clean, runs migration, and seeds fresh data. |
| `npm run admin:create` | **Admin Provisioner** | CLI utility to promote any email to administrator or provision a new admin account. |
| `npm test` | **Run Test Suite** | Runs `scripts/test_all_pages_e2e.js`, verifying endpoints, constraints, connection leak guards, and workflows. |
| `npm run test:e2e` | **E2E Integration** | Alias for the end-to-end integration test suite. |

### Frontend Commands (`client/`)

Run all frontend commands inside the `client/` directory:

| Command | Action | Description |
|---|---|---|
| `npm run dev` | **Start Dev Server** | Runs the Vite dev server on `http://localhost:5173` with Hot Module Replacement and API proxying. |
| `npm run build` | **Build for Production**| Compiles and minifies the React application into optimized static assets in `client/dist/`. |
| `npm run preview` | **Preview Build** | Serves the local production build from `client/dist/` for pre-deployment inspection. |

---

## 🎯 Features & User Guide

### 1. Customer / Player Experience

#### Turf & Pitch Discovery (`/turfs`)
- **Multi-Parameter Filtering**: Filter turfs by Dhaka coverage zone (`Dhanmondi`, `Banani`, `Gulshan`, `Bashundhara`, `Mirpur`, `Uttara`, etc.), maximum hourly budget slider, and search keyword.
- **Interactive Arena Map**: Toggle between grid view and interactive Leaflet map mode (`TurfMap.jsx`) with custom markers displaying arena names, rates, and ratings.
- **Turf Detail View (`/turfs/:id`)**: High-resolution image gallery, arena amenities, address, and interactive map marker.

#### Slot Booking & Real-Time Availability
- **Pitch Selection**: Toggle between available pitches/fields within the arena (e.g. *Pitch A - 5v5 Artificial Turf*, *Pitch B - 7v7 Natural Grass*).
- **Date Selector & Slots Grid**: Select any date within the upcoming 14+ days. Real-time slot status indicators:
  - 🟢 **Available**: Ready for reservation.
  - 🔴 **Booked**: Reserved by another player.
  - 🟡 **Selected**: Added to current reservation drawer.
- **Dynamic Pricing Display**: Shows active rates based on field rules (e.g. ৳1,500/hr off-peak vs ৳2,000/hr weekend peak).

#### Flexible Checkout: Full Payment vs. Cash at Venue
- **Full Online Payment (100%)**: Instant reservation confirmation via card or mobile banking (bKash/Nagad).
- **Cash at Venue (20% Advance)**: Pay a mandatory 20% advance online to lock the slot; settle the remaining 80% in cash directly with the organizer at the venue before kickoff.

#### Booking Management (`/my-bookings`)
- **Status Tracking**: Badges display current status (`pending`, `advance_paid`, `confirmed`, `completed`, `cancelled`).
- **Cancellation**: Customers can cancel reservations directly with a stated reason, automatically freeing the pitch slot for other players.
- **Cash Settlement**: View remaining cash balance owed at the pitch.
- **Verified Reviews**: Submit a 1 to 5-star rating with written feedback once a booking is confirmed/completed.

#### Football Marketplace (`/marketplace`)
- **Category Navigation**: Filter by *Boots*, *Jerseys*, *Balls*, *Equipment*, *Accessories*, or *Goalkeeper*.
- **Condition Filter**: Choose between *Brand New* and *Used* items.
- **Live Search & Price Sort**: Search titles and descriptions with instant backend pagination and debounce.
- **Product Detail (`/marketplace/:id`)**: Multi-angle image preview, seller shop info, real-time stock availability, and verified buyer reviews.
- **Wishlist (`/wishlist`)**: Save favorite gear for later with 1-click cart addition.

#### Shopping Cart & Checkout (`/cart`)
- **Persistent Cart State**: Cart items and quantities persist across page reloads via `CartContext` and `localStorage`.
- **Checkout Options**:
  - **Full Online Payment**: Pay 100% via online gateway.
  - **Cash on Delivery (20% Advance)**: Pay 20% online advance to confirm order dispatch; pay remaining balance upon parcel delivery.
- **Delivery Details**: Input delivery address and contact phone number.

#### Order Management (`/my-orders`)
- **Order Pipeline**: Track order state: `placed` ➔ `advance_paid` ➔ `confirmed` ➔ `shipped` ➔ `delivered`.
- **Verified Product Reviews**: Once an order reaches `delivered` status, customers can submit a verified review with star ratings and comments.

#### User Profile (`/profile`)
- **Personal Information**: Update full name and contact phone number.
- **Security**: Change password with old password verification.
- **Role Claiming**: Apply for **Organizer** or **Seller** roles without creating a new account.

---

### 2. Turf Organizer Dashboard (`/organizer`)

Access granted to users with the `organizer` role (approved by Admin).

#### Turf Arena Management
- **Arena Profile**: Create and update turf name, description, address, and base hourly rate.
- **Interactive Location Pinning**: Use `LocationPickerMap.jsx` to click anywhere on the Dhaka map to automatically populate latitude and longitude coordinates.
- **Photo Uploads**: Upload arena media through the backend `multer` upload handler and set a primary cover photo.

#### Pitch & Field Configuration
- **Add Fields**: Configure individual pitches within the arena, specifying pitch name, field size (`5v5`, `7v7`, `11v11`), and surface (`Artificial Turf`, `Natural Grass`, `Indoor Hardwood`).
- **Dynamic Pricing Rules**: Define custom pricing windows for specific days of the week (e.g. Friday/Saturday 18:00 - 23:00 at ৳2,200/hr).
- **Price History Logs**: System automatically records old rate, new rate, and timestamp whenever pricing rules are edited.

#### Hourly Slot Schedule & Generation
- **Bulk Slot Generator**: Generate hourly pitch slots across date ranges (08:00 to 23:00) with a single click.
- **Manual Slot Toggle**: Lock or unlock individual slots for maintenance or private events.

#### Booking Operations & Cash Collection
- **Incoming Reservations**: View full customer details, booked slots, and payment status.
- **Confirm / Cancel**: Confirm incoming pending reservations or cancel invalid bookings.
- **Collect Cash at Venue**: Record cash collection for reservations booked under the 20% advance scheme, transitioning cash balance to ৳0.00 and marking the reservation confirmed.

---

### 3. Sports Gear Seller Dashboard (`/seller`)

Access granted to users with the `seller` role (approved by Admin).

#### Product & Inventory Management
- **Add Products**: Create product listings with title, price, category, condition (`new` / `used`), stock count, and description.
- **Photo Gallery**: Upload multiple product photos via `multer` and designate a cover photo.
- **Stock Tracking**: System automatically decrements stock upon order placement and prevents orders exceeding available quantity.

#### Order Fulfillment Pipeline
- **Order Processing**: View orders containing items from your shop.
- **Status Lifecycle**: Progress orders through fulfillment stages:
  1. `placed` / `advance_paid`: New order received.
  2. `confirmed`: Order accepted and packaged.
  3. `shipped`: Handed over to courier.
  4. `delivered`: Delivered to customer.
- **COD Cash Collection**: Record cash collected by courier for advance-paid orders, completing the transaction.

---

### 4. Platform Administrator Command Center (`/admin`)

Access restricted to users with `is_admin === true`.

#### Executive KPI Overview
- **Real-Time Metrics**: Total Gross Transaction Volume (BDT), Net Platform Commission Earned (default 8%), Active Users, Total Turfs, Total Products, Bookings, and Orders.

#### Approvals & Verification Queue
- **Organizer Verification**: Inspect trade licence number, payout account, and applicant details. Approve or reject with feedback.
- **Seller Verification**: Inspect shop name, trade details, and payout account. Approve or reject.
- **Turf Verification**: Review newly submitted turfs, verify location and pricing before publishing to public discovery.
- **Product Moderation**: Verify marketplace product listings before they appear in the catalog.

#### Platform Catalog & User Governance
- **User Management**: View all platform users, filter by role, activate or suspend accounts, and promote users to Administrator.
- **Direct Catalog Moderation**: Toggle active status or delete problematic turfs and products.
- **Review Moderation**: View customer reviews across all turfs and products with one-click deletion of inappropriate content.

#### Financial Ledger & Transactions
- **Transaction Ledger**: Inspect all payments across bookings and orders, filtering by payment method (card, bKash, Nagad), status, and purpose (`full`, `advance`, `balance`).
- **Commission Ledger**: Real-time calculation of platform earnings vs organizer/seller payouts.

#### Coverage Zones Management
- **Dhaka Zones**: Add, update, or remove coverage areas (e.g. *Dhanmondi*, *Banani*, *Uttara*) with center latitude/longitude coordinates.

#### System Configuration & Live Controls
- **Global Broadcast Banner**: Toggle display of global announcement banners across the platform, with configurable severity (`info`, `success`, `warning`, `alert`).
- **Maintenance Mode**: Toggle platform maintenance flag.
- **Commission Rate Configuration**: Adjust platform commission percentage (default 8%).
- **Advance Percentage Configuration**: Adjust mandatory cash advance percentage (default 20%).
- **Support Contacts**: Update helpline phone number and official support email.

#### Security & Audit Trail
- **Immutable Audit Log**: Every administrative action (approval, rejection, user suspension, setting modification) is logged with `admin_id`, `action`, `target_type`, `target_id`, `details` JSON, client IP, and timestamp.

---

## 🔄 Event & Operational Workflows

### Workflow 1: User Onboarding & Role Approval

```mermaid
flowchart TD
    A[New User Registers] --> B[Default Customer Account Created]
    B --> C{User Requests Additional Role?}
    C -- No --> D[Browse Turfs & Shop Marketplace]
    C -- Yes: Become Organizer --> E[Submit Trade Licence & Payout Account]
    C -- Yes: Become Seller --> F[Submit Shop Name & Payout Account]
    E --> G[Status: Pending Approval]
    F --> H[Status: Pending Approval]
    G --> I[Admin Reviews in Approvals Queue]
    H --> I
    I -- Approved --> J[Role Granted: Access Dashboard]
    I -- Rejected --> K[Rejection Reason Displayed to User]
```

1. **Registration**: User registers via `/register` (name, email, phone, password). A base `users` record is inserted with `customers` entry.
2. **Role Application**: In `/profile`, the user submits organizer metadata (trade licence, payout account) or seller metadata (shop name, payout account).
3. **Admin Queue**: Request appears in the Admin Dashboard (`/admin`). The admin reviews and approves or rejects the application.
4. **Token Refresh**: Upon approval, the user's JWT reflects the new role (`organizer` or `seller`), unlocking their respective dashboard.

---

### Workflow 2: Turf Setup, Pitch Configuration & Slot Generation

```mermaid
flowchart TD
    A[Organizer Creates Turf] --> B[Pin Coordinates on Leaflet Map]
    B --> C[Upload Arena Cover & Photos]
    C --> D[Submit for Admin Approval]
    D --> E[Admin Approves Turf]
    E --> F[Add Fields / Pitches: 5v5, 7v7, 11v11]
    F --> G[Configure Pricing Rules: Off-Peak vs Peak]
    G --> H[Run Bulk Slot Generator: 08:00 - 23:00]
    H --> I[Slots Live for Customer Booking]
```

1. **Turf Creation**: Organizer provides name, address, base rate, and uses the Leaflet map pin picker to set exact GPS coordinates.
2. **Media Upload**: Arena photos uploaded via `POST /api/turfs/:id/images`.
3. **Approval**: Admin reviews and approves the turf.
4. **Field Configuration**: Organizer adds pitches (e.g., Pitch 1: 5v5 Artificial Turf).
5. **Pricing Rules**: Organizer defines peak hours (e.g., Friday/Saturday evening at ৳2,000/hr). Changes trigger `trg_log_price_history`.
6. **Slot Generation**: Organizer triggers slot generation (`POST /api/slots/generate`) for a specified date range.

---

### Workflow 3: Pitch Reservation & Payment Settlement

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Frontend as Client (React)
    participant Backend as Express API
    participant DB as PostgreSQL
    participant Gateway as Sandbox Gateway
    actor Organizer

    Customer->>Frontend: Select Turf, Field, Date & Time Slots
    Frontend->>Backend: POST /api/bookings (sp_create_booking)
    Backend->>DB: CALL sp_create_booking()
    DB->>DB: Trigger: trg_prevent_double_booking
    DB-->>Backend: Booking #ID created (status: pending)
    Backend-->>Frontend: Return booking details

    Customer->>Frontend: Select Payment: Full (100%) vs Advance (20%)
    Frontend->>Backend: POST /api/payments/initiate
    Backend-->>Frontend: Return Intent & Sandbox Modal
    Customer->>Frontend: Submit Card / bKash / Nagad Details
    Frontend->>Backend: POST /api/payments/confirm
    Backend->>DB: CALL sp_record_payment()

    alt 100% Full Payment
        DB-->>Backend: Status -> 'confirmed', cash_balance = 0
    else 20% Cash Advance
        DB-->>Backend: Status -> 'advance_paid', cash_balance = 80%
        Customer->>Organizer: Arrives at venue before kickoff
        Organizer->>Backend: PATCH /api/bookings/:id/collect-cash
        Backend->>DB: Settle balance, Status -> 'confirmed'
    end
    Backend-->>Frontend: Booking Confirmed!
```

1. **Slot Selection**: Customer selects available slots on the calendar.
2. **Procedure Execution**: `sp_create_booking` calculates exact rates via `fn_get_hourly_rate` and inserts rows into `bookings` and `booking_slots`.
3. **Double-Booking Prevention**: Database trigger `trg_prevent_double_booking` checks whether any selected slot is already taken by a non-cancelled booking.
4. **Payment Settlement**:
   - **Full Payment**: `sp_record_payment` marks booking `confirmed` with ৳0 balance.
   - **20% Advance**: `sp_record_payment` marks booking `advance_paid` with 80% balance due at venue.
5. **Cash Collection**: At venue, organizer clicks *Collect Cash* (`PATCH /api/bookings/:id/collect-cash`), settling the remaining balance.

---

### Workflow 4: Marketplace Order Lifecycle & Delivery

```mermaid
flowchart TD
    A[Customer Adds Items to Cart] --> B[Proceed to Cart Checkout]
    B --> C{Select Payment Option}
    C -- 100% Full Online --> D[Pay 100% via Gateway]
    C -- 20% Advance COD --> E[Pay 20% Advance via Gateway]
    D --> F[Order Status: confirmed]
    E --> G[Order Status: advance_paid, 80% COD Balance]
    F --> H[Seller Packages Item]
    G --> H
    H --> I[Seller Updates Status: shipped]
    I --> J[Courier Delivers to Customer]
    J --> K{Was Order 20% COD?}
    K -- Yes --> L[Seller Collects COD Cash: PATCH /orders/:id/collect-cash]
    K -- No --> M[Order Status: delivered]
    L --> M
    M --> N[Customer Verified Review Unlocked]
```

1. **Cart & Inventory**: Customer reviews cart items. Stock is validated.
2. **Checkout & Advance**: Customer pays full amount or 20% advance for Cash on Delivery.
3. **Fulfillment Pipeline**: Seller views the order in their dashboard and transitions status: `placed` ➔ `confirmed` ➔ `shipped`. The trigger `trg_order_status_transition` prevents illegal jumps.
4. **Delivery & Cash Settlement**: Once delivered, the courier reconciles any remaining COD cash balance, and the order is marked `delivered`.

---

### Workflow 5: Verified Reviews & Feedback

```mermaid
flowchart LR
    subgraph Turf Review
        A[Customer completes booking] --> B{Booking confirmed & past?}
        B -- Yes --> C[Submit 1-5 Star Rating & Review]
        C --> D[fn_turf_avg_rating updates average]
    end

    subgraph Product Review
        E[Customer orders gear] --> F{Order delivered?}
        F -- Yes --> G[Submit 1-5 Star Rating & Review]
        G --> H[Product Review Displayed on Item Page]
    end
```

- **Turf Reviews**: Can only be submitted for valid non-cancelled bookings. The database calculates aggregate turf ratings using `fn_turf_avg_rating(turf_id)`.
- **Product Reviews**: Enforced via composite foreign key referencing `order_items(order_id, product_id)`. Customers can only review products they have actually purchased and received.

---

### Workflow 6: System Configuration & Security Audit Trail

```mermaid
flowchart TD
    A[Admin Changes Platform Settings] --> B[Update Commission Rate / Broadcast / Maintenance]
    B --> C[Saved to platform_settings Table]
    C --> D[auditLogger() Records Action]
    D --> E[admin_audit_logs Entry Created: admin_id, IP, Action, Payload]
    E --> F[Visible in Security Audit Trail]
```

1. **Setting Modification**: Admin toggles a broadcast announcement, adjusts platform commission rate (e.g. 8%), or changes advance percentage (e.g. 20%).
2. **Audit Logging**: `auditLogger` creates an immutable audit record in `admin_audit_logs` storing the admin ID, action name, target, previous/new parameters, client IP, and timestamp.

---

## 🛡️ Database Integrity & Stored Logic

### Stored Procedures

1. **`sp_create_booking(p_customer_id, p_slots_json, INOUT p_booking_id, INOUT p_total_amount)`**
   - Atomically iterates over selected slots, calculates rates server-side using `fn_get_hourly_rate()`, inserts the booking record, and links slots in `booking_slots`.

2. **`sp_record_payment(p_user_id, p_booking_id, p_order_id, p_amount, p_method, p_purpose, INOUT p_payment_id)`**
   - Handles full payments, advance payments, and cash balance settlements for both bookings and orders with strict row locking (`FOR UPDATE`) and balance validation.

### Database Triggers

1. **`trg_prevent_double_booking`** (on `booking_slots` `BEFORE INSERT`)
   - Queries `booking_slots` joined with `bookings` to ensure the slot is not already held by an active (non-cancelled) reservation. If reserved, raises exception `23P01`.
2. **`trg_log_price_history`** (on `pricing_rules` `AFTER INSERT OR UPDATE OF hourly_rate`)
   - Automatically writes an entry into `price_history` preserving old rate, new rate, and modification timestamp.
3. **`trg_order_status_transition`** (on `orders` `BEFORE UPDATE OF status`)
   - Enforces legal status progression (`placed` ➔ `advance_paid` ➔ `confirmed` ➔ `shipped` ➔ `delivered`) and blocks illegal transitions or alterations to delivered/cancelled orders.

### Stored Functions

1. **`fn_get_hourly_rate(p_field_id, p_slot_date, p_start_time)`**
   - Matches field-specific pricing rules for the given day of week and time window. Falls back to parent turf base hourly rate, with a safety baseline floor of ৳1,200.00.
2. **`fn_turf_avg_rating(p_turf_id)`**
   - Computes the average star rating of a turf from verified reviews linked to non-cancelled bookings.

---

## 🧪 Testing & Verification

MatchFix includes a comprehensive automated test suite verifying all 18 pages, API routes, database constraints, and connection pooling integrity.

Run the test suite from the `server/` directory:

```powershell
cd server
npm test
```

### Test Suite Coverage:
- ✅ **Authentication**: Registration, Login, Token Refresh, Role Encoding, Password Resets.
- ✅ **Turfs & Areas**: Area listings, Turf creation, GIS coordinates, Photo uploads.
- ✅ **Pricing & Schedule**: Peak rule matching, slot generation, price history logging.
- ✅ **ACID Reservations**: Procedure execution, double-booking prevention trigger, cancellation slot release.
- ✅ **Payments**: Payment intent creation, sandbox card simulation, advance payment splits.
- ✅ **Marketplace**: Product listings, category filters, condition checks, stock decrement.
- ✅ **Orders & Fulfillment**: Cart checkout, COD 20% advance, status transition validation trigger.
- ✅ **Verified Reviews**: Review eligibility checks, booking/order item linkage constraints.
- ✅ **Admin Governance**: KPI statistics, approvals queue, user role modification, platform settings, audit trail.
- ✅ **Zero Connection Leak Guard**: Verifies that PostgreSQL connection pool active checkouts drain to zero after every request.

---

## 📄 License

This project is licensed under the MIT License — feel free to use and extend it for your academic, personal, or commercial applications.
