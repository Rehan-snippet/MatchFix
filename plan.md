# MatchFix Development Plan

This is a detailed, phase-by-phase execution plan for the requested features and bug fixes.

## Phase 1: Profile Management (Edit Info & Password)
**Objective**: Allow users to update their personal information and change their password directly from their profile page.

- **Step 1.1: Backend - Edit Info Endpoint**
  - In `server/src/controllers/users.controller.js`, create an `updateProfile` function.
  - Update the `users` table to `SET name = $1, phone = $2 WHERE user_id = $3`.
  - Map this to `PUT /api/users/me` in `users.routes.js`.

- **Step 1.2: Backend - Change Password Endpoint**
  - In `server/src/controllers/users.controller.js`, create an `updatePassword` function.
  - Verify the old password, hash the new password using `bcrypt`, and update the database.
  - Map this to `PUT /api/users/me/password` in `users.routes.js`.

- **Step 1.3: Frontend - Profile UI Updates**
  - In `client/src/pages/Profile.jsx`, add two new UI sections or modals: "Edit Personal Details" and "Change Password".
  - Implement form state management and submit handlers using the `api` client to call the new endpoints.
  - Add success/error toast notifications or inline messages to provide user feedback.

---

## Phase 2: Marketplace Search, Filters, and Infinite Scroll Fix
**Objective**: Fix the broken category filters, connect the search bar properly to the backend, and eliminate the UI jitter during infinite scroll.

- **Step 2.1: Fix Backend Parameter Mapping**
  - In `client/src/pages/Marketplace.jsx`, update the `params` object passed to `api.get('/products')`.
  - Map the state `q` to `params.search` (since the backend expects `search`, not `q`).
  - Conditionally add `params.category = category` if the category is not `'All Items'`.

- **Step 2.2: Remove Local Filtering**
  - Inside the `.then((res) => { ... })` block in `Marketplace.jsx`, remove the local `list.filter(...)` logic. The backend will now correctly return only the filtered items, ensuring pagination boundaries are respected.

- **Step 2.3: Fix Infinite Scroll Jitter**
  - The jitter is caused by the entire product grid being unmounted and replaced by skeletons every time `loading` becomes true (even for page 2+).
  - Change the rendering condition from `{loading ? (<Skeletons/>) : ...}` to `{loading && page === 1 ? (<Skeletons/>) : ...}`.
  - This ensures skeletons only show on the initial load, while subsequent pages smoothly append to the existing grid (which already has a `Loading more items...` indicator at the bottom).

---

## Phase 3: Interactive Location Map (Lat/Lng)
**Objective**: Provide an interactive map for turf organizers to accurately pin their turf location instead of typing raw coordinates.

- **Step 3.1: Map Component Setup**
  - In `client/src/pages/OrganizerDashboard.jsx`, import `MapContainer`, `TileLayer`, `Marker`, and `useMapEvents` from `react-leaflet` (and ensure Leaflet CSS is imported).

- **Step 3.2: Implement Click-to-Pin Logic**
  - Create a small helper component (e.g., `LocationPicker`) that uses `useMapEvents` to listen for map clicks.
  - When the map is clicked, read the `lat` and `lng` from the event and update the main form's `latitude` and `longitude` state.

- **Step 3.3: UI Integration**
  - Add the Map to the "Location Details" section of the turf creation/edit form.
  - Set the map's center to the current `form.latitude`/`form.longitude` if they exist, or default to a central location (e.g., Dhaka).
  - Bind the marker position to the form state so the pin moves immediately when the organizer clicks on the map.

---

## Phase 4: Product Reviews System
**Objective**: Allow customers who have purchased a product to leave a rating and review, and display these reviews on the product page.

- **Step 4.1: Backend - Add Review Endpoint**
  - Create an `addProductReview` function in `server/src/controllers/products.controller.js`.
  - Validate that the requesting `user_id` has an order in the `orders` and `order_items` tables with `status = 'delivered'` that contains the specified `product_id`.
  - Insert the review into the `product_reviews` table using the verified `order_id`.
  - Map this to `POST /api/products/:id/reviews` in `products.routes.js`.

- **Step 4.2: Frontend - Review Submission UI**
  - In `client/src/pages/ProductDetail.jsx`, add a "Write a Review" section below the product details.
  - Add an interactive 5-star rating selector and a comment text area.
  - Hide or disable this form if the user is not logged in or hasn't purchased the item (which can be handled via a backend error or by proactively fetching purchase eligibility).

- **Step 4.3: Frontend - Reviews Display**
  - Ensure existing reviews (which are already returned by the `GET /api/products/:id` endpoint) are displayed cleanly in a list format, showing the customer name, rating, comment, and date.
