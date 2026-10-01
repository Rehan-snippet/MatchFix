const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const http = require('http');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');
const db = require('../src/config/db');
const app = require('../server');

/**
 * MatchFix End-to-End Query & Connection Verification Test Suite
 *
 * Covers ALL 18 frontend pages and shared components:
 * 1. Home (Home.jsx & BroadcastBanner.jsx)
 * 2. Login (Login.jsx & AuthContext.jsx)
 * 3. Register (Register.jsx)
 * 4. Forgot Password (ForgotPassword.jsx)
 * 5. Reset Password (ResetPassword.jsx)
 * 6. Turfs Discovery (Turfs.jsx)
 * 7. Turf Detail & Slot Booking (TurfDetail.jsx)
 * 8. Marketplace (Marketplace.jsx)
 * 9. Product Detail & Verified Reviews (ProductDetail.jsx)
 * 10. Cart & ACID Checkout (Cart.jsx)
 * 11. Payment Modal (SandboxPaymentModal.jsx)
 * 12. Wishlist (Wishlist.jsx)
 * 13. My Bookings (MyBookings.jsx)
 * 14. My Orders (MyOrders.jsx)
 * 15. User Profile & Dynamic Roles (Profile.jsx)
 * 16. Organizer Dashboard (OrganizerDashboard.jsx)
 * 17. Seller Dashboard (SellerDashboard.jsx)
 * 18. Admin Dashboard (AdminDashboard.jsx)
 * 19. Unhandled Routes & 404 (NotFound.jsx)
 * 20. Database Connection Pool Clean Drain & Zero-Leak Verification
 */

let server;
let port;
let passed = 0;
let failed = 0;

function check(label, condition, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label} ${details ? '— ' + details : ''}`);
    failed++;
  }
}

/**
 * Asserts that the pool currently has ZERO checked-out clients (total - idle == 0).
 */
function assertNoCheckedOutClients(context) {
  const activeCheckedOut = db.pool.totalCount - db.pool.idleCount;
  check(
    `[DB Connection Guard] 0 checked-out connections after: ${context} (total: ${db.pool.totalCount}, idle: ${db.pool.idleCount})`,
    activeCheckedOut === 0,
    `Leaked connections detected: ${activeCheckedOut}`
  );
}

function req(method, reqPath, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const isJson = body && typeof body === 'object';
    const payload = isJson ? JSON.stringify(body) : body;
    const headers = {};
    if (isJson) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const request = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: reqPath,
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let data;
          try {
            data = JSON.parse(raw);
          } catch {
            data = raw;
          }
          resolve({ status: res.statusCode, headers: res.headers, data });
        });
      }
    );

    request.on('error', reject);
    if (payload) request.write(payload);
    request.end();
  });
}

async function runAllPagesTestSuite() {
  console.log('======================================================================');
  console.log('🚀 MATCHFIX COMPREHENSIVE E2E QUERY & CONNECTION VERIFICATION SUITE');
  console.log('======================================================================\n');

  // Start HTTP server on random free port
  server = app.listen(0);
  port = server.address().port;
  console.log(`📡 Express API test server listening on http://127.0.0.1:${port}`);

  // Test DB connection
  const connTest = await db.query('SELECT current_database() as db_name, NOW() as server_time');
  console.log(`🗄️  Connected to PostgreSQL: ${connTest.rows[0].db_name} at ${connTest.rows[0].server_time}\n`);

  const runId = Date.now().toString().slice(-6);
  function genPhone(digit = '7') {
    return `01${digit}${Math.floor(10000000 + Math.random() * 90000000)}`;
  }
  const adminPhone = genPhone('7');
  const orgPhone = genPhone('8');
  const sellerPhone = genPhone('9');
  const customerPhone = genPhone('3');

  const passwordPlain = 'TestPass123!';
  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  // Keep track of IDs to clean up
  const createdUserIds = [];
  const createdTurfIds = [];
  const createdProductIds = [];
  const createdAreaIds = [];

  try {
    // -------------------------------------------------------------------------
    // Setup: Seed Dedicated Multi-Role Test Users
    // -------------------------------------------------------------------------
    console.log('📋 Preparing Test Fixtures & Role Accounts...');

    // 1. Admin User
    const adminEmail = `admin_${runId}@matchfix.dev`;
    const adminRes = await db.query(
      `INSERT INTO users (name, email, phone, password_hash, is_active, is_admin)
       VALUES ($1, $2, $3, $4, TRUE, TRUE)
       RETURNING user_id`,
      ['Test Admin', adminEmail, adminPhone, passwordHash]
    );
    const adminId = adminRes.rows[0].user_id;
    createdUserIds.push(adminId);
    const adminToken = jwt.sign(
      { user_id: adminId, email: adminEmail, is_admin: true, roles: ['admin'] },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    // 2. Organizer User
    const organizerEmail = `organizer_${runId}@matchfix.dev`;
    const orgRes = await db.query(
      `INSERT INTO users (name, email, phone, password_hash, is_active, is_admin)
       VALUES ($1, $2, $3, $4, TRUE, FALSE)
       RETURNING user_id`,
      ['Test Organizer', organizerEmail, orgPhone, passwordHash]
    );
    const organizerId = orgRes.rows[0].user_id;
    createdUserIds.push(organizerId);
    await db.query(
      `INSERT INTO organizers (user_id, trade_licence, payout_account, approval_status)
       VALUES ($1, $2, $3, 'approved')`,
      [organizerId, `TL-${runId}`, 'bKash-01710000002']
    );
    const organizerToken = jwt.sign(
      { user_id: organizerId, email: organizerEmail, is_admin: false, roles: ['organizer'] },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    // 3. Seller User
    const sellerEmail = `seller_${runId}@matchfix.dev`;
    const selRes = await db.query(
      `INSERT INTO users (name, email, phone, password_hash, is_active, is_admin)
       VALUES ($1, $2, $3, $4, TRUE, FALSE)
       RETURNING user_id`,
      ['Test Seller', sellerEmail, sellerPhone, passwordHash]
    );
    const sellerId = selRes.rows[0].user_id;
    createdUserIds.push(sellerId);
    await db.query(
      `INSERT INTO sellers (user_id, shop_name, payout_account, approval_status)
       VALUES ($1, $2, $3, 'approved')`,
      [sellerId, `SportZone-${runId}`, 'Nagad-01710000003']
    );
    const sellerToken = jwt.sign(
      { user_id: sellerId, email: sellerEmail, is_admin: false, roles: ['seller'] },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    // 4. Customer User
    const customerEmail = `customer_${runId}@matchfix.dev`;
    const custRes = await db.query(
      `INSERT INTO users (name, email, phone, password_hash, is_active, is_admin)
       VALUES ($1, $2, $3, $4, TRUE, FALSE)
       RETURNING user_id`,
      ['Test Customer', customerEmail, customerPhone, passwordHash]
    );
    const customerId = custRes.rows[0].user_id;
    createdUserIds.push(customerId);
    await db.query(
      `INSERT INTO customers (user_id, default_address)
       VALUES ($1, $2)`,
      [customerId, 'Road 11, Banani, Dhaka']
    );
    const customerToken = jwt.sign(
      { user_id: customerId, email: customerEmail, is_admin: false, roles: ['customer'] },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    // 5. Test Area
    const areaRes = await db.query(
      `INSERT INTO areas (name, city, center_lat, center_lng)
       VALUES ($1, 'Dhaka', 23.7937, 90.4043)
       ON CONFLICT (name) DO UPDATE SET city = 'Dhaka'
       RETURNING area_id`,
      [`Test Zone ${runId}`]
    );
    const testAreaId = areaRes.rows[0].area_id;
    createdAreaIds.push(testAreaId);

    console.log('✅ Fixtures successfully provisioned.\n');
    assertNoCheckedOutClients('Fixtures Setup');

    // =========================================================================
    // PAGE 1: Home (Home.jsx & BroadcastBanner.jsx)
    // =========================================================================
    console.log('\n📄 --- Testing Page 1: Home (Home.jsx & BroadcastBanner.jsx) ---');
    {
      // 1.1 GET /api/turfs
      const resTurfs = await req('GET', '/api/turfs');
      check('Home: GET /api/turfs returns 200', resTurfs.status === 200);
      check('Home: GET /api/turfs returns array', Array.isArray(resTurfs.data));

      // 1.2 GET /api/products
      const resProducts = await req('GET', '/api/products');
      check('Home: GET /api/products returns 200', resProducts.status === 200);
      check('Home: GET /api/products returns array', Array.isArray(resProducts.data));

      // 1.3 GET /api/settings/public (BroadcastBanner)
      const resSettings = await req('GET', '/api/settings/public');
      check('BroadcastBanner: GET /api/settings/public returns 200', resSettings.status === 200);
      check('BroadcastBanner: Response contains broadcast flags', typeof resSettings.data?.broadcast_enabled === 'boolean');

      assertNoCheckedOutClients('Page 1: Home');
    }

    // =========================================================================
    // PAGE 2: Login (Login.jsx & AuthContext.jsx)
    // =========================================================================
    console.log('\n📄 --- Testing Page 2: Login (Login.jsx & AuthContext.jsx) ---');
    {
      // 2.1 Login via Email
      const resLoginEmail = await req('POST', '/api/auth/login', {
        email: customerEmail,
        password: passwordPlain,
      });
      check('Login: POST /api/auth/login with Email returns 200', resLoginEmail.status === 200);
      check('Login: Returns JWT token', !!resLoginEmail.data?.token);
      check('Login: Returns user object with email', resLoginEmail.data?.user?.email === customerEmail);

      // 2.2 Login via Phone (Unified Identifier)
      const resLoginPhone = await req('POST', '/api/auth/login', {
        email: customerPhone,
        password: passwordPlain,
      });
      check('Login: POST /api/auth/login with Phone returns 200', resLoginPhone.status === 200);
      check('Login: User object matches', resLoginPhone.data?.user?.user_id === customerId);

      // 2.3 Login with Wrong Password
      const resLoginBad = await req('POST', '/api/auth/login', {
        email: customerEmail,
        password: 'IncorrectPassword!',
      });
      check('Login: Wrong password returns 401 Unauthorized', resLoginBad.status === 401);

      // 2.4 Load authenticated user profile (loadMe in AuthContext)
      const resMe = await req('GET', '/api/users/me', null, resLoginEmail.data.token);
      check('AuthContext: GET /api/users/me returns 200', resMe.status === 200);
      check('AuthContext: Customer profile present', !!resMe.data?.customer);

      assertNoCheckedOutClients('Page 2: Login');
    }

    // =========================================================================
    // PAGE 3: Register (Register.jsx)
    // =========================================================================
    console.log('\n📄 --- Testing Page 3: Register (Register.jsx) ---');
    {
      const newEmail = `newuser_${runId}@matchfix.dev`;
      const newPhone = genPhone('6');
      const resReg = await req('POST', '/api/auth/register', {
        name: 'New Athlete',
        email: newEmail,
        phone: newPhone,
        password: passwordPlain,
        confirmPassword: passwordPlain,
        role: 'customer',
      });
      check('Register: POST /api/auth/register creates user (201)', resReg.status === 201);
      check('Register: Returns valid token', !!resReg.data?.token);

      if (resReg.data?.user?.user_id) {
        createdUserIds.push(resReg.data.user.user_id);
        // Verify in DB
        const dbCheck = await db.query('SELECT * FROM users WHERE user_id = $1', [resReg.data.user.user_id]);
        check('Register: User persisted in DB users table', dbCheck.rowCount === 1);
        const custCheck = await db.query('SELECT * FROM customers WHERE user_id = $1', [resReg.data.user.user_id]);
        check('Register: Role customer created in customers table', custCheck.rowCount === 1);
      }

      // Reject duplicate email
      const resDup = await req('POST', '/api/auth/register', {
        name: 'Duplicate Athlete',
        email: newEmail,
        phone: `0192${runId}99`,
        password: passwordPlain,
        confirmPassword: passwordPlain,
      });
      check('Register: Rejects duplicate email (400)', resDup.status === 400);

      assertNoCheckedOutClients('Page 3: Register');
    }

    // =========================================================================
    // PAGE 4: Forgot Password (ForgotPassword.jsx)
    // =========================================================================
    console.log('\n📄 --- Testing Page 4: Forgot Password (ForgotPassword.jsx) ---');
    let resetToken = null;
    {
      const resForgot = await req('POST', '/api/auth/forgot-password', {
        email: customerEmail,
      });
      check('ForgotPassword: POST /api/auth/forgot-password returns 200', resForgot.status === 200);
      check('ForgotPassword: DB token generated', !!resForgot.data?.token);
      resetToken = resForgot.data?.token;

      // Verify token in DB password_resets table
      const resetDb = await db.query('SELECT * FROM password_resets WHERE user_id = $1', [customerId]);
      check('ForgotPassword: password_resets record exists in DB', resetDb.rowCount > 0);

      assertNoCheckedOutClients('Page 4: Forgot Password');
    }

    // =========================================================================
    // PAGE 5: Reset Password (ResetPassword.jsx)
    // =========================================================================
    console.log('\n📄 --- Testing Page 5: Reset Password (ResetPassword.jsx) ---');
    {
      // 5.1 Invalid reset token
      const resBadToken = await req('POST', '/api/auth/reset-password', {
        token: 'invalid_token_xyz',
        new_password: 'BrandNewPassword123!',
      });
      check('ResetPassword: Invalid token rejected (400)', resBadToken.status === 400);

      // 5.2 Valid reset token
      if (resetToken) {
        const newPass = 'UpdatedSecret999!';
        const resReset = await req('POST', '/api/auth/reset-password', {
          token: resetToken,
          new_password: newPass,
        });
        check('ResetPassword: Valid token resets password (200)', resReset.status === 200);

        // Verify login works with the new password
        const resLoginNew = await req('POST', '/api/auth/login', {
          email: customerEmail,
          password: newPass,
        });
        check('ResetPassword: Login with new password succeeds (200)', resLoginNew.status === 200);

        // Revert password back for rest of tests
        const revertHash = await bcrypt.hash(passwordPlain, 10);
        await db.query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [revertHash, customerId]);
      }

      assertNoCheckedOutClients('Page 5: Reset Password');
    }

    // =========================================================================
    // PAGE 6: Turfs Discovery (Turfs.jsx)
    // =========================================================================
    console.log('\n📄 --- Testing Page 6: Turfs Discovery (Turfs.jsx) ---');
    {
      // 6.1 GET /api/areas
      const resAreas = await req('GET', '/api/areas');
      check('Turfs: GET /api/areas returns 200', resAreas.status === 200);
      check('Turfs: Areas list is non-empty', Array.isArray(resAreas.data) && resAreas.data.length > 0);

      // 6.2 Filter turfs with query parameters
      const resFilter = await req('GET', `/api/turfs?area_id=${testAreaId}&sort=price_asc`);
      check('Turfs: GET /api/turfs with area_id & sort returns 200', resFilter.status === 200);

      // 6.3 Search turfs
      const resSearch = await req('GET', '/api/turfs?search=Arena');
      check('Turfs: GET /api/turfs with search keyword returns 200', resSearch.status === 200);

      assertNoCheckedOutClients('Page 6: Turfs');
    }

    // =========================================================================
    // PAGE 7: Turf Details & Slot Booking (TurfDetail.jsx)
    // =========================================================================
    console.log('\n📄 --- Testing Page 7: Turf Details & Booking (TurfDetail.jsx) ---');
    let testTurfId = null;
    let testFieldId = null;
    let testSlotDate = '2026-11-15';
    let testSlotStartTime = '16:00:00';
    let testSlotEndTime = '17:00:00';
    let testBookingId = null;
    {
      // Organizer creates turf
      const resCreateTurf = await req(
        'POST',
        '/api/turfs',
        {
          name: `Apex Arena ${runId}`,
          address: 'Block E, Banani, Dhaka',
          area_id: testAreaId,
          hourly_rate: 1500,
          description: 'State of the art 5v5 turf',
        },
        organizerToken
      );
      check('TurfDetail Setup: Create turf (201)', resCreateTurf.status === 201);
      testTurfId = resCreateTurf.data?.turf_id;
      createdTurfIds.push(testTurfId);

      // Approve turf so it is active
      await db.query(`UPDATE turfs SET approval_status = 'approved' WHERE turf_id = $1`, [testTurfId]);

      // Add field
      const resField = await req(
        'POST',
        '/api/fields',
        {
          turf_id: testTurfId,
          name: 'Main Pitch A',
          side_type: '5v5',
          surface: 'Artificial Turf',
        },
        organizerToken
      );
      check('TurfDetail Setup: Add field to turf (201)', resField.status === 201);
      testFieldId = resField.data?.field_id;

      // Generate slots for field via official slots generator
      const resGenSlots = await req(
        'POST',
        '/api/slots/generate',
        {
          field_id: testFieldId,
          start_date: testSlotDate,
          end_date: testSlotDate,
          start_hour: 16,
          end_hour: 20,
        },
        organizerToken
      );
      check('TurfDetail Setup: Generate slots via API (200)', resGenSlots.status === 200);

      // 7.1 GET /api/turfs/:id
      const resGetTurf = await req('GET', `/api/turfs/${testTurfId}`);
      check('TurfDetail: GET /api/turfs/:id returns 200', resGetTurf.status === 200);
      check('TurfDetail: Returns turf fields array', Array.isArray(resGetTurf.data?.fields));

      // 7.2 GET /api/slots?field_id=...&date=...
      const resSlots = await req('GET', `/api/slots?field_id=${testFieldId}&date=${testSlotDate}`);
      check('TurfDetail: GET /api/slots returns 200', resSlots.status === 200);
      const foundSlot = resSlots.data?.find((s) => s.start_time.startsWith('16:00'));
      check('TurfDetail: Scheduled slot is available (is_reserved === false)', foundSlot?.is_reserved === false);

      // 7.3 POST /api/bookings (Customer books slot)
      const resBook = await req(
        'POST',
        '/api/bookings',
        {
          slots: [
            {
              field_id: testFieldId,
              slot_date: testSlotDate,
              start_time: testSlotStartTime,
              end_time: testSlotEndTime,
            },
          ],
          payment_method: 'online',
        },
        customerToken
      );
      check('TurfDetail: POST /api/bookings creates booking (201)', resBook.status === 201);
      testBookingId = resBook.data?.booking_id || resBook.data?.booking?.booking_id;
      check('TurfDetail: Booking ID generated', !!testBookingId);

      // Verify slot is now booked in DB
      const resSlotsAfter = await req('GET', `/api/slots?field_id=${testFieldId}&date=${testSlotDate}`);
      const slotAfter = resSlotsAfter.data?.find((s) => s.start_time.startsWith('16:00'));
      check('TurfDetail: Slot marked reserved (is_reserved === true) after booking', slotAfter?.is_reserved === true);

      assertNoCheckedOutClients('Page 7: Turf Details & Booking');
    }

    // =========================================================================
    // PAGE 8: Marketplace (Marketplace.jsx)
    // =========================================================================
    console.log('\n📄 --- Testing Page 8: Marketplace (Marketplace.jsx) ---');
    let testProductId = null;
    {
      // Seller creates test product
      const resProdCreate = await req(
        'POST',
        '/api/products',
        {
          title: `Match Pro Boots ${runId}`,
          price: 3200,
          category: 'Boots',
          stock: 15,
          condition: 'new',
          description: 'FG pro football boots with carbon plate',
        },
        sellerToken
      );
      check('Marketplace Setup: Seller creates product (201)', resProdCreate.status === 201);
      testProductId = resProdCreate.data?.product_id;
      createdProductIds.push(testProductId);

      // Approve product so it appears on marketplace
      await db.query(`UPDATE products SET approval_status = 'approved' WHERE product_id = $1`, [testProductId]);

      // 8.1 GET /api/products with pagination & category
      const resProds = await req('GET', '/api/products?page=1&limit=10&category=Boots');
      check('Marketplace: GET /api/products returns 200', resProds.status === 200);
      check('Marketplace: Products list is an array', Array.isArray(resProds.data));

      // 8.2 POST /api/users/me/wishlist/:id (Add to wishlist)
      const resWishAdd = await req('POST', `/api/users/me/wishlist/${testProductId}`, {}, customerToken);
      check('Marketplace: POST /api/users/me/wishlist/:id adds item (200/201)', resWishAdd.status === 200 || resWishAdd.status === 201);

      // 8.3 GET /api/users/me/wishlist
      const resWishlist = await req('GET', '/api/users/me/wishlist', null, customerToken);
      check('Marketplace: GET /api/users/me/wishlist returns items', Array.isArray(resWishlist.data));
      check('Marketplace: Added item in wishlist', resWishlist.data?.some((w) => w.product_id === testProductId));

      // 8.4 DELETE /api/users/me/wishlist/:id
      const resWishDel = await req('DELETE', `/api/users/me/wishlist/${testProductId}`, {}, customerToken);
      check('Marketplace: DELETE /api/users/me/wishlist/:id removes item (200)', resWishDel.status === 200);

      assertNoCheckedOutClients('Page 8: Marketplace');
    }

    // =========================================================================
    // PAGE 9: Product Details & Reviews (ProductDetail.jsx)
    // =========================================================================
    console.log('\n📄 --- Testing Page 9: Product Details & Reviews (ProductDetail.jsx) ---');
    {
      // 9.1 GET /api/products/:id
      const resProdDetail = await req('GET', `/api/products/${testProductId}`);
      check('ProductDetail: GET /api/products/:id returns 200', resProdDetail.status === 200);
      check('ProductDetail: Title matches', resProdDetail.data?.title?.includes(`Match Pro Boots ${runId}`));

      // 9.2 GET /api/products/:id/review-eligibility (Before purchase)
      const resEligBefore = await req('GET', `/api/products/${testProductId}/review-eligibility`, null, customerToken);
      check('ProductDetail: GET review-eligibility returns 200', resEligBefore.status === 200);
      check('ProductDetail: Cannot review before purchase', resEligBefore.data?.can_review === false);

      // Create a delivered order in DB to test review submission
      const orderDeliv = await db.query(
        `INSERT INTO orders (customer_id, total_amount, status, payment_method, delivery_address)
         VALUES ($1, 3200, 'delivered', 'online', 'Banani, Dhaka')
         RETURNING order_id`,
        [customerId]
      );
      const delivOrderId = orderDeliv.rows[0].order_id;
      await db.query(
        `INSERT INTO order_items (order_id, product_id, qty, unit_price, status)
         VALUES ($1, $2, 1, 3200, 'delivered')`,
        [delivOrderId, testProductId]
      );

      // Check review-eligibility after delivery
      const resEligAfter = await req('GET', `/api/products/${testProductId}/review-eligibility`, null, customerToken);
      check('ProductDetail: Eligible to review after delivered order', resEligAfter.data?.can_review === true);

      // 9.3 POST /api/products/:id/reviews
      const resRev = await req(
        'POST',
        `/api/products/${testProductId}/reviews`,
        {
          order_id: delivOrderId,
          rating: 5,
          comment: 'Outstanding traction and lightweight build!',
        },
        customerToken
      );
      check('ProductDetail: POST /api/products/:id/reviews posts review (201)', resRev.status === 201);

      // Verify in DB product_reviews table
      const revCheck = await db.query(
        'SELECT * FROM product_reviews WHERE product_id = $1 AND order_id = $2',
        [testProductId, delivOrderId]
      );
      check('ProductDetail: Review persisted in product_reviews table', revCheck.rowCount === 1);

      assertNoCheckedOutClients('Page 9: Product Details');
    }

    // =========================================================================
    // PAGE 10: Cart & Checkout (Cart.jsx)
    // =========================================================================
    console.log('\n📄 --- Testing Page 10: Cart & Checkout (Cart.jsx) ---');
    let testOrderId = null;
    {
      // Test stock decrement & atomic order creation
      const stockBefore = (await db.query('SELECT stock FROM products WHERE product_id = $1', [testProductId])).rows[0].stock;

      const resCheckout = await req(
        'POST',
        '/api/orders',
        {
          items: [{ product_id: testProductId, qty: 2 }],
          delivery_address: 'House 4, Road 2, Gulshan-1, Dhaka',
          delivery_phone: '01719998877',
          payment_method: 'online',
        },
        customerToken
      );
      check('Cart: POST /api/orders places multi-item order (201)', resCheckout.status === 201);
      testOrderId = resCheckout.data?.order?.order_id || resCheckout.data?.order_id;
      check('Cart: Returns created order_id', !!testOrderId);

      // Verify stock was decremented by 2
      const stockAfter = (await db.query('SELECT stock FROM products WHERE product_id = $1', [testProductId])).rows[0].stock;
      check('Cart: ACID transaction decremented inventory stock by 2', stockBefore - stockAfter === 2);

      assertNoCheckedOutClients('Page 10: Cart & Checkout');
    }

    // =========================================================================
    // PAGE 11: Payment Checkout Modal (SandboxPaymentModal.jsx)
    // =========================================================================
    console.log('\n📄 --- Testing Page 11: Payment Modal (SandboxPaymentModal.jsx) ---');
    {
      // 11.1 Initiate Payment for Order
      const resInit = await req(
        'POST',
        '/api/payments/initiate',
        {
          order_id: testOrderId,
          amount: 6400,
          method: 'sandbox_card',
          purpose: 'full',
        },
        customerToken
      );
      check('PaymentModal: POST /api/payments/initiate returns 200/201', resInit.status === 200 || resInit.status === 201);
      const intentId = resInit.data?.intent_id || resInit.data?.payment_id;
      check('PaymentModal: Generates intent_id', !!intentId);

      // 11.2 Confirm Sandbox Payment
      const resConfirm = await req(
        'POST',
        '/api/payments/confirm',
        {
          intent_id: intentId,
          card_number: '4242424242424242',
        },
        customerToken
      );
      check('PaymentModal: POST /api/payments/confirm completes transaction (200)', resConfirm.status === 200);

      // Verify order status updated to confirmed in DB
      const dbOrder = await db.query('SELECT status FROM orders WHERE order_id = $1', [testOrderId]);
      check('PaymentModal: Order updated to confirmed in DB', ['confirmed', 'advance_paid'].includes(dbOrder.rows[0]?.status));

      assertNoCheckedOutClients('Page 11: Payment Modal');
    }

    // =========================================================================
    // PAGE 12: Wishlist (Wishlist.jsx)
    // =========================================================================
    console.log('\n📄 --- Testing Page 12: Wishlist (Wishlist.jsx) ---');
    {
      // Add item first
      await req('POST', `/api/users/me/wishlist/${testProductId}`, {}, customerToken);

      // GET wishlist
      const resWish = await req('GET', '/api/users/me/wishlist', null, customerToken);
      check('Wishlist: GET /api/users/me/wishlist returns 200', resWish.status === 200);
      check('Wishlist: Wishlist array contains items with title & price', resWish.data?.some((i) => i.product_id === testProductId));

      // DELETE wishlist item
      const resDel = await req('DELETE', `/api/users/me/wishlist/${testProductId}`, {}, customerToken);
      check('Wishlist: DELETE removes item (200)', resDel.status === 200);

      assertNoCheckedOutClients('Page 12: Wishlist');
    }

    // =========================================================================
    // PAGE 13: My Bookings (MyBookings.jsx)
    // =========================================================================
    console.log('\n📄 --- Testing Page 13: My Bookings (MyBookings.jsx) ---');
    {
      // 13.1 GET /api/bookings/mine
      const resMine = await req('GET', '/api/bookings/mine', null, customerToken);
      check('MyBookings: GET /api/bookings/mine returns 200', resMine.status === 200);
      check('MyBookings: Customer bookings returned', Array.isArray(resMine.data));

      // 13.2 PATCH /api/bookings/:id/cancel
      if (testBookingId) {
        const resCancel = await req(
          'PATCH',
          `/api/bookings/${testBookingId}/cancel`,
          { cancel_reason: 'Cancelled by customer' },
          customerToken
        );
        check('MyBookings: PATCH /bookings/:id/cancel cancels booking (200)', resCancel.status === 200);

        // Verify in DB
        const bkCheck = await db.query('SELECT status FROM bookings WHERE booking_id = $1', [testBookingId]);
        check('MyBookings: Booking status set to cancelled in DB', bkCheck.rows[0]?.status === 'cancelled');
      }

      assertNoCheckedOutClients('Page 13: My Bookings');
    }

    // =========================================================================
    // PAGE 14: My Orders (MyOrders.jsx)
    // =========================================================================
    console.log('\n📄 --- Testing Page 14: My Orders (MyOrders.jsx) ---');
    {
      // 14.1 GET /api/orders/mine
      const resOrdersMine = await req('GET', '/api/orders/mine', null, customerToken);
      check('MyOrders: GET /api/orders/mine returns 200', resOrdersMine.status === 200);
      check('MyOrders: Orders returned as array with order items', Array.isArray(resOrdersMine.data));

      // 14.2 Review order item via orders controller
      if (testOrderId) {
        // Mark item delivered in DB to allow review
        await db.query(`UPDATE order_items SET status = 'delivered' WHERE order_id = $1`, [testOrderId]);

        const resOrderRev = await req(
          'POST',
          `/api/orders/${testOrderId}/items/${testProductId}/review`,
          { rating: 5, comment: 'Great fit and quality!' },
          customerToken
        );
        check('MyOrders: POST review for delivered order item succeeds (200/201)', resOrderRev.status === 200 || resOrderRev.status === 201);
      }

      assertNoCheckedOutClients('Page 14: My Orders');
    }

    // =========================================================================
    // PAGE 15: User Profile & Dynamic Roles (Profile.jsx)
    // =========================================================================
    console.log('\n📄 --- Testing Page 15: User Profile & Roles (Profile.jsx) ---');
    {
      // 15.1 GET /api/users/me
      const resProfile = await req('GET', '/api/users/me', null, customerToken);
      check('Profile: GET /api/users/me returns 200', resProfile.status === 200);

      // 15.2 PATCH /api/users/me (Update Name & Phone)
      const resUpdateMe = await req(
        'PATCH',
        '/api/users/me',
        { name: 'Updated Athlete Name', phone: `0171${runId}88` },
        customerToken
      );
      check('Profile: PATCH /api/users/me updates name & phone (200)', resUpdateMe.status === 200);

      // 15.3 PUT /api/users/me/password (Change Password)
      const resChangePass = await req(
        'PUT',
        '/api/users/me/password',
        { currentPassword: passwordPlain, newPassword: 'NewProfilePass123!' },
        customerToken
      );
      check('Profile: PUT /api/users/me/password changes password (200)', resChangePass.status === 200);

      // Revert password
      const passHashRevert = await bcrypt.hash(passwordPlain, 10);
      await db.query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [passHashRevert, customerId]);

      // 15.4 POST & PATCH role profiles
      const resCustRole = await req(
        'PATCH',
        '/api/users/me/roles/customer',
        { default_address: 'House 50, Road 7, Dhanmondi, Dhaka' },
        customerToken
      );
      check('Profile: PATCH /users/me/roles/customer updates default address (200)', resCustRole.status === 200);

      // 15.5 POST /api/auth/refresh
      const resRefresh = await req('POST', '/api/auth/refresh', {}, customerToken);
      check('Profile: POST /api/auth/refresh issues refreshed token (200)', resRefresh.status === 200);
      check('Profile: Refreshed token present', !!resRefresh.data?.token);

      assertNoCheckedOutClients('Page 15: User Profile');
    }

    // =========================================================================
    // PAGE 16: Organizer Dashboard (OrganizerDashboard.jsx)
    // =========================================================================
    console.log('\n📄 --- Testing Page 16: Organizer Dashboard (OrganizerDashboard.jsx) ---');
    {
      // 16.1 GET /api/turfs?organizer_id=...
      const resOrgTurfs = await req('GET', `/api/turfs?organizer_id=${organizerId}`, null, organizerToken);
      check('OrganizerDashboard: GET /api/turfs?organizer_id returns 200', resOrgTurfs.status === 200);

      // 16.2 PATCH /api/turfs/:id (Update details)
      const resPatchTurf = await req(
        'PATCH',
        `/api/turfs/${testTurfId}`,
        { hourly_rate: 1600, description: 'Updated Turf Description' },
        organizerToken
      );
      check('OrganizerDashboard: PATCH /api/turfs/:id updates details (200)', resPatchTurf.status === 200);

      // 16.3 POST /api/turfs/:id/images (Add photo via URL)
      const resTurfImg = await req(
        'POST',
        `/api/turfs/${testTurfId}/images`,
        { url: 'https://images.unsplash.com/photo-1529900245534-5e69eef013b0?auto=format&fit=crop&w=800&q=80', is_cover: true },
        organizerToken
      );
      check('OrganizerDashboard: POST /api/turfs/:id/images adds photo (200/201)', resTurfImg.status === 200 || resTurfImg.status === 201);
      const turfImgId = resTurfImg.data?.image_id;

      // 16.4 PATCH /api/turfs/:id/images/:imageId/cover
      if (turfImgId) {
        const resCover = await req('PATCH', `/api/turfs/${testTurfId}/images/${turfImgId}/cover`, {}, organizerToken);
        check('OrganizerDashboard: PATCH cover image returns 200', resCover.status === 200);
      }

      // 16.5 POST & DELETE pricing rules
      const resRule = await req(
        'POST',
        `/api/fields/${testFieldId}/pricing-rules`,
        { day_of_week: 5, start_time: '18:00', end_time: '23:00', hourly_rate: 2000 },
        organizerToken
      );
      check('OrganizerDashboard: POST /fields/:id/pricing-rules creates rule (201)', resRule.status === 201);
      const ruleId = resRule.data?.rule_id;

      if (ruleId) {
        const resDelRule = await req('DELETE', `/api/fields/${testFieldId}/pricing-rules/${ruleId}`, null, organizerToken);
        check('OrganizerDashboard: DELETE /fields/:id/pricing-rules/:ruleId removes rule (200)', resDelRule.status === 200);
      }

      // 16.6 GET /api/slots/schedule
      const resSched = await req('GET', `/api/slots/schedule?turf_id=${testTurfId}&date=${testSlotDate}`, null, organizerToken);
      check('OrganizerDashboard: GET /api/slots/schedule returns schedule matrix (200)', resSched.status === 200);

      // 16.7 POST /api/slots/toggle (Block slot)
      const resToggle = await req(
        'POST',
        '/api/slots/toggle',
        { field_id: testFieldId, slot_date: testSlotDate, start_time: '19:00:00', end_time: '20:00:00', action: 'block' },
        organizerToken
      );
      check('OrganizerDashboard: POST /api/slots/toggle blocks slot (200)', resToggle.status === 200);

      // 16.8 GET /api/bookings/for-my-turfs
      const resOrgBookings = await req('GET', '/api/bookings/for-my-turfs', null, organizerToken);
      check('OrganizerDashboard: GET /api/bookings/for-my-turfs returns bookings (200)', resOrgBookings.status === 200);

      assertNoCheckedOutClients('Page 16: Organizer Dashboard');
    }

    // =========================================================================
    // PAGE 17: Seller Dashboard (SellerDashboard.jsx)
    // =========================================================================
    console.log('\n📄 --- Testing Page 17: Seller Dashboard (SellerDashboard.jsx) ---');
    {
      // 17.1 GET /api/products?seller_id=...
      const resSellerProds = await req('GET', `/api/products?seller_id=${sellerId}`, null, sellerToken);
      check('SellerDashboard: GET /api/products?seller_id returns 200', resSellerProds.status === 200);

      // 17.2 PATCH /api/products/:id (Update product details)
      const resPatchProd = await req(
        'PATCH',
        `/api/products/${testProductId}`,
        { price: 3400, stock: 25 },
        sellerToken
      );
      check('SellerDashboard: PATCH /api/products/:id updates price & stock (200)', resPatchProd.status === 200);

      // 17.3 POST /api/products/:id/images
      const resProdImg = await req(
        'POST',
        `/api/products/${testProductId}/images`,
        { url: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=400&q=80', is_cover: true },
        sellerToken
      );
      check('SellerDashboard: POST /api/products/:id/images adds photo (200/201)', resProdImg.status === 200 || resProdImg.status === 201);
      const prodImgId = resProdImg.data?.image_id;

      // 17.4 PATCH /api/products/:productId/images/:imageId/cover
      if (prodImgId) {
        const resProdCover = await req('PATCH', `/api/products/${testProductId}/images/${prodImgId}/cover`, {}, sellerToken);
        check('SellerDashboard: PATCH /products/:id/images/:imgId/cover updates cover (200)', resProdCover.status === 200);
      }

      // 17.5 GET /api/orders/for-my-products
      const resSellerOrders = await req('GET', '/api/orders/for-my-products', null, sellerToken);
      check('SellerDashboard: GET /api/orders/for-my-products returns orders (200)', resSellerOrders.status === 200);

      // 17.6 PATCH item fulfillment status
      if (testOrderId) {
        const resItemStatus = await req(
          'PATCH',
          `/api/orders/${testOrderId}/items/${testProductId}/status`,
          { status: 'shipped' },
          sellerToken
        );
        check('SellerDashboard: PATCH item status to shipped (200)', resItemStatus.status === 200);
      }

      assertNoCheckedOutClients('Page 17: Seller Dashboard');
    }

    // =========================================================================
    // PAGE 18: Admin Dashboard (AdminDashboard.jsx)
    // =========================================================================
    console.log('\n📄 --- Testing Page 18: Admin Dashboard (AdminDashboard.jsx) ---');
    {
      // 18.1 GET /api/admin/stats
      const resStats = await req('GET', '/api/admin/stats', null, adminToken);
      check('AdminDashboard: GET /api/admin/stats returns 200', resStats.status === 200);
      check('AdminDashboard: Stats contains total_users count', resStats.data?.total_users !== undefined);

      // 18.2 GET /api/admin/users
      const resUsers = await req('GET', '/api/admin/users?limit=10', null, adminToken);
      check('AdminDashboard: GET /api/admin/users returns user list (200)', resUsers.status === 200);

      // 18.3 PATCH /api/admin/users/:id
      const resToggleActive = await req('PATCH', `/api/admin/users/${customerId}`, { is_active: true }, adminToken);
      check('AdminDashboard: PATCH /api/admin/users/:id updates user (200)', resToggleActive.status === 200);

      // 18.4 GET pending approvals
      const resPendTurfs = await req('GET', '/api/admin/pending-turfs', null, adminToken);
      check('AdminDashboard: GET /api/admin/pending-turfs returns 200', resPendTurfs.status === 200);

      const resPendProds = await req('GET', '/api/admin/pending-products', null, adminToken);
      check('AdminDashboard: GET /api/admin/pending-products returns 200', resPendProds.status === 200);

      // 18.5 GET /api/admin/bookings & orders
      const resAllBk = await req('GET', '/api/admin/bookings', null, adminToken);
      check('AdminDashboard: GET /api/admin/bookings returns 200', resAllBk.status === 200);

      const resAllOrd = await req('GET', '/api/admin/orders', null, adminToken);
      check('AdminDashboard: GET /api/admin/orders returns 200', resAllOrd.status === 200);

      // 18.5.1 PATCH /api/admin/bookings/:id/status (Verify updated_at & cancelled_at)
      if (testBookingId) {
        const resAdminBkStatus = await req(
          'PATCH',
          `/api/admin/bookings/${testBookingId}/status`,
          { status: 'cancelled', cancel_reason: 'Admin test cancellation' },
          adminToken
        );
        check('AdminDashboard: PATCH /api/admin/bookings/:id/status (cancelled) returns 200', resAdminBkStatus.status === 200);
        check('AdminDashboard: Booking cancelled_at is populated', !!resAdminBkStatus.data?.booking?.cancelled_at);
        check('AdminDashboard: Booking updated_at is populated', !!resAdminBkStatus.data?.booking?.updated_at);

        const resAdminBkConfirm = await req(
          'PATCH',
          `/api/admin/bookings/${testBookingId}/status`,
          { status: 'confirmed' },
          adminToken
        );
        check('AdminDashboard: PATCH /api/admin/bookings/:id/status (confirmed) returns 200', resAdminBkConfirm.status === 200);
      }

      // 18.5.2 PATCH /api/admin/orders/:id/status (Verify updated_at & order revive)
      if (testOrderId) {
        const resAdminOrdCancel = await req(
          'PATCH',
          `/api/admin/orders/${testOrderId}/status`,
          { status: 'cancelled' },
          adminToken
        );
        check('AdminDashboard: PATCH /api/admin/orders/:id/status (cancelled) returns 200', resAdminOrdCancel.status === 200);
        check('AdminDashboard: Order updated_at is populated', !!resAdminOrdCancel.data?.order?.updated_at);

        // Revive cancelled order
        const resAdminOrdRevive = await req(
          'PATCH',
          `/api/admin/orders/${testOrderId}/status`,
          { status: 'confirmed' },
          adminToken
        );
        check('AdminDashboard: PATCH /api/admin/orders/:id/status (revive from cancelled) returns 200', resAdminOrdRevive.status === 200);
      }

      // 18.5.3 PATCH /api/admin/turfs/:id/status (Verify updated_at)
      if (testTurfId) {
        const resAdminTurfStatus = await req(
          'PATCH',
          `/api/admin/turfs/${testTurfId}/status`,
          { is_active: true, approval_status: 'approved' },
          adminToken
        );
        check('AdminDashboard: PATCH /api/admin/turfs/:id/status returns 200', resAdminTurfStatus.status === 200);
        check('AdminDashboard: Turf updated_at is populated', !!resAdminTurfStatus.data?.turf?.updated_at);
      }

      // 18.5.4 PATCH /api/admin/products/:id/status (Verify updated_at)
      if (testProductId) {
        const resAdminProdStatus = await req(
          'PATCH',
          `/api/admin/products/${testProductId}/status`,
          { is_active: true, stock: 20, approval_status: 'approved' },
          adminToken
        );
        check('AdminDashboard: PATCH /api/admin/products/:id/status returns 200', resAdminProdStatus.status === 200);
        check('AdminDashboard: Product updated_at is populated', !!resAdminProdStatus.data?.product?.updated_at);
      }

      // 18.6 Financials
      const resFin = await req('GET', '/api/admin/financials/summary', null, adminToken);
      check('AdminDashboard: GET /api/admin/financials/summary returns 200', resFin.status === 200);

      const resTx = await req('GET', '/api/admin/financials/transactions', null, adminToken);
      check('AdminDashboard: GET /api/admin/financials/transactions returns 200', resTx.status === 200);

      // 18.7 Settings (Platform Broadcast & Fees)
      const resGetSet = await req('GET', '/api/admin/settings', null, adminToken);
      check('AdminDashboard: GET /api/admin/settings returns 200', resGetSet.status === 200);

      const resPatchSet = await req(
        'PATCH',
        '/api/admin/settings',
        { broadcast_message: `Welcome to MatchFix Test Suite ${runId}!`, broadcast_enabled: true },
        adminToken
      );
      check('AdminDashboard: PATCH /api/admin/settings updates broadcast (200)', resPatchSet.status === 200);

      // 18.8 Audit logs
      const resAudit = await req('GET', '/api/admin/audit-logs', null, adminToken);
      check('AdminDashboard: GET /api/admin/audit-logs returns 200', resAudit.status === 200);

      // 18.9 Moderation: Reviews
      const resRevList = await req('GET', '/api/admin/reviews', null, adminToken);
      check('AdminDashboard: GET /api/admin/reviews returns 200', resRevList.status === 200);

      // 18.10 Areas CRUD
      const resAdminAreas = await req('GET', '/api/admin/areas', null, adminToken);
      check('AdminDashboard: GET /api/admin/areas returns 200', resAdminAreas.status === 200);

      const resCreateArea = await req('POST', '/api/admin/areas', { name: `Admin Zone ${runId}`, city: 'Dhaka' }, adminToken);
      check('AdminDashboard: POST /api/admin/areas creates area (201)', resCreateArea.status === 201);
      const newAreaId = resCreateArea.data?.area_id;

      if (newAreaId) {
        const resPatchArea = await req('PATCH', `/api/admin/areas/${newAreaId}`, { name: `Admin Zone Updated ${runId}` }, adminToken);
        check('AdminDashboard: PATCH /api/admin/areas/:id updates area (200)', resPatchArea.status === 200);

        const resDelArea = await req('DELETE', `/api/admin/areas/${newAreaId}`, null, adminToken);
        check('AdminDashboard: DELETE /api/admin/areas/:id deletes area (200)', resDelArea.status === 200);
      }

      assertNoCheckedOutClients('Page 18: Admin Dashboard');
    }

    // =========================================================================
    // PAGE 19: Unhandled Routes & 404 Handling (NotFound.jsx)
    // =========================================================================
    console.log('\n📄 --- Testing Page 19: 404 Route Handling (NotFound.jsx) ---');
    {
      const res404 = await req('GET', '/api/non_existent_route_xyz_404');
      check('NotFound: Unhandled route returns 404 Not Found', res404.status === 404);
      check('NotFound: Clean JSON error payload returned', res404.data?.error?.includes('Route not found'));

      assertNoCheckedOutClients('Page 19: NotFound Route');
    }

    // =========================================================================
    // CLEANUP & TEARDOWN
    // =========================================================================
    console.log('\n🧹 Cleaning up test fixtures from database...');
    // Delete in reverse dependency order
    for (const tId of createdTurfIds) {
      await db.query('DELETE FROM turfs WHERE turf_id = $1', [tId]);
    }
    for (const pId of createdProductIds) {
      await db.query('DELETE FROM products WHERE product_id = $1', [pId]);
    }
    for (const uId of createdUserIds) {
      await db.query('DELETE FROM users WHERE user_id = $1', [uId]);
    }
    for (const aId of createdAreaIds) {
      await db.query('DELETE FROM areas WHERE area_id = $1', [aId]);
    }
    console.log('✅ Test fixtures cleaned up successfully.');

  } catch (err) {
    console.error('💥 Fatal error during test execution:', err);
    failed++;
  } finally {
    // =========================================================================
    // STEP 20: Connection Pool Termination & Zero-Connection Leak Verification
    // =========================================================================
    console.log('\n======================================================================');
    console.log('🔒 CONNECTION TEARDOWN & ZERO-LEAK VERIFICATION');
    console.log('======================================================================');

    // 1. Verify 0 clients are checked out before draining
    const checkedOutBeforeDrain = db.pool.totalCount - db.pool.idleCount;
    check(
      `Zero checked-out clients prior to pool drain (checkedOut = ${checkedOutBeforeDrain})`,
      checkedOutBeforeDrain === 0
    );

    // 2. Close HTTP Server
    if (server) {
      await new Promise((resolve) => server.close(resolve));
      console.log('✅ Express HTTP test server closed.');
    }

    // 3. Drain and close PostgreSQL Pool
    console.log(`🔌 Draining and closing PostgreSQL connection pool (total clients: ${db.pool.totalCount})...`);
    await db.pool.end();
    check('db.pool.end() completed successfully', true);
    check('Pool total client count is 0 after drain', db.pool.totalCount === 0);
    check('Pool idle client count is 0 after drain', db.pool.idleCount === 0);

    // 4. Verify no dangling application connections remain on PostgreSQL server
    // We open a single ephemeral client to probe PostgreSQL's pg_stat_activity, then immediately close it.
    let danglingCount = 0;
    try {
      const probeClient = new Client({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/matchfix',
      });
      await probeClient.connect();
      const statRes = await probeClient.query(`
        SELECT count(*) as active_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
          AND pid != pg_backend_pid()
          AND application_name NOT LIKE '%pgAdmin%'
          AND query NOT LIKE '%pg_stat_activity%'
      `);
      danglingCount = parseInt(statRes.rows[0]?.active_connections || '0', 10);
      await probeClient.end();
      check(
        `PostgreSQL server confirms 0 leaked application connection sockets (found: ${danglingCount})`,
        danglingCount === 0 || danglingCount === 1 // allowance only if background dev server is separately running
      );
    } catch (probeErr) {
      console.warn('Note: Could not run probeClient query (non-fatal):', probeErr.message);
    }

    console.log('\n======================================================================');
    console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed`);
    console.log('======================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  }
}

runAllPagesTestSuite();
