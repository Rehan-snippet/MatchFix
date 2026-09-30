const db = require('../src/config/db');
const { sign } = require('../src/utils/jwt');
const http = require('http');
const app = require('../server.js');

async function runDynamicUITests() {
  const server = app.listen(0);
  const port = server.address().port;
  console.log(`\n🧪 Phase 7: Dynamic Ratings, Reviews, and Pricing Tests — port ${port}\n`);

  let passed = 0;
  let failed = 0;

  function check(label, condition, detail = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${label}`);
      passed++;
    } else {
      console.log(`  ❌ FAIL: ${label} ${detail}`);
      failed++;
    }
  }

  const ts = Date.now();

  // Setup Users
  const orgEmail = `org_phase7_${ts}@test.com`;
  const sellerEmail = `seller_phase7_${ts}@test.com`;
  const cust1Email = `cust1_phase7_${ts}@test.com`;
  const cust2Email = `cust2_phase7_${ts}@test.com`;

  const orgUser = await db.query(
    'INSERT INTO users (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING user_id',
    ['Phase7 Organizer', orgEmail, '01722000001', 'hash']
  );
  const organizerId = orgUser.rows[0].user_id;
  await db.query(
    'INSERT INTO organizers (user_id, trade_licence, payout_account, approval_status) VALUES ($1, $2, $3, $4)',
    [organizerId, 'TRAD-777', 'bKash-01722000001', 'approved']
  );

  const selUser = await db.query(
    'INSERT INTO users (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING user_id',
    ['Phase7 Seller', sellerEmail, '01722000002', 'hash']
  );
  const sellerId = selUser.rows[0].user_id;
  await db.query(
    'INSERT INTO sellers (user_id, shop_name, payout_account, approval_status) VALUES ($1, $2, $3, $4)',
    [sellerId, 'Dynamic Sports Shop', 'bKash-01722000002', 'approved']
  );

  const c1User = await db.query(
    'INSERT INTO users (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING user_id',
    ['Player Alice', cust1Email, '01722000003', 'hash']
  );
  const cust1Id = c1User.rows[0].user_id;
  await db.query('INSERT INTO customers (user_id, default_address) VALUES ($1, $2)', [cust1Id, 'Dhanmondi, Dhaka']);

  const c2User = await db.query(
    'INSERT INTO users (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING user_id',
    ['Player Bob', cust2Email, '01722000004', 'hash']
  );
  const cust2Id = c2User.rows[0].user_id;
  await db.query('INSERT INTO customers (user_id, default_address) VALUES ($1, $2)', [cust2Id, 'Gulshan, Dhaka']);

  const cust1Token = sign({ user_id: cust1Id, roles: ['customer'], is_admin: false });
  const cust2Token = sign({ user_id: cust2Id, roles: ['customer'], is_admin: false });

  // Setup Turf & Field
  const areaRes = await db.query('SELECT area_id FROM areas LIMIT 1');
  const areaId = areaRes.rows[0].area_id;

  const turfRes = await db.query(
    `INSERT INTO turfs (organizer_id, area_id, name, address, hourly_rate, approval_status)
     VALUES ($1, $2, $3, $4, 1800.00, 'approved') RETURNING turf_id`,
    [organizerId, areaId, 'Phase7 Dynamic Turf Arena', 'Bashundhara, Dhaka']
  );
  const turfId = turfRes.rows[0].turf_id;

  const fieldRes = await db.query(
    `INSERT INTO fields (turf_id, name, surface, side_type)
     VALUES ($1, 'Pitch A', 'Artificial Turf', '7v7') RETURNING field_id`,
    [turfId]
  );
  const fieldId = fieldRes.rows[0].field_id;

  // Setup Product
  const prodRes = await db.query(
    `INSERT INTO products (seller_id, title, price, category, condition, stock, approval_status)
     VALUES ($1, 'Phase7 Performance Shin Guards', 850.00, 'Accessories', 'new', 50, 'approved') RETURNING product_id`,
    [sellerId]
  );
  const productId = prodRes.rows[0].product_id;

  function req(options, body) {
    return new Promise((resolve, reject) => {
      const r = http.request(
        {
          hostname: 'localhost',
          port,
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, body: data ? JSON.parse(data) : {} });
            } catch (e) {
              resolve({ status: res.statusCode, body: data });
            }
          });
        }
      );
      r.on('error', reject);
      if (body) r.write(JSON.stringify(body));
      r.end();
    });
  }

  try {
    // -------------------------------------------------------------
    // Test 1: New Turf has 0.00 rating and 0 reviews
    // -------------------------------------------------------------
    console.log('--- Test Suite 1: Dynamic Turf Ratings & Reviews ---');

    const turfList1 = await req({ path: `/api/turfs`, method: 'GET' });
    const foundTurf1 = turfList1.body.find((t) => t.turf_id === turfId);
    check('New turf exists in public listing', !!foundTurf1);
    check('New turf has average_rating 0.00 or 0', Number(foundTurf1?.average_rating || 0) === 0);
    check('New turf has review_count 0', Number(foundTurf1?.review_count || 0) === 0);

    // Bookings for Player Alice and Player Bob
    // Booking 1: Alice
    const b1Res = await req(
      { path: '/api/bookings', method: 'POST', headers: { Authorization: `Bearer ${cust1Token}` } },
      { slots: [{ field_id: fieldId, slot_date: '2026-11-25', start_time: '14:00:00', end_time: '15:00:00' }] }
    );
    const b1Id = b1Res.body.booking_id;
    // Pay & confirm booking 1
    const p1Intent = await req(
      { path: '/api/payments/initiate', method: 'POST', headers: { Authorization: `Bearer ${cust1Token}` } },
      { booking_id: b1Id, amount: 1800, purpose: 'full' }
    );
    await req(
      { path: '/api/payments/confirm', method: 'POST', headers: { Authorization: `Bearer ${cust1Token}` } },
      { intent_id: p1Intent.body.intent_id, card_number: '4242424242424242' }
    );

    // Booking 2: Bob
    const b2Res = await req(
      { path: '/api/bookings', method: 'POST', headers: { Authorization: `Bearer ${cust2Token}` } },
      { slots: [{ field_id: fieldId, slot_date: '2026-11-25', start_time: '15:00:00', end_time: '16:00:00' }] }
    );
    const b2Id = b2Res.body.booking_id;
    // Pay & confirm booking 2
    const p2Intent = await req(
      { path: '/api/payments/initiate', method: 'POST', headers: { Authorization: `Bearer ${cust2Token}` } },
      { booking_id: b2Id, amount: 1800, purpose: 'full' }
    );
    await req(
      { path: '/api/payments/confirm', method: 'POST', headers: { Authorization: `Bearer ${cust2Token}` } },
      { intent_id: p2Intent.body.intent_id, card_number: '4242424242424242' }
    );

    // Alice reviews turf with 5 stars
    const r1Res = await req(
      { path: `/api/bookings/${b1Id}/review`, method: 'POST', headers: { Authorization: `Bearer ${cust1Token}` } },
      { rating: 5, comment: 'Phenomenal turf quality and lights!' }
    );
    check('Alice submits verified turf review (5 stars)', r1Res.status === 201);

    // Bob reviews turf with 4 stars
    const r2Res = await req(
      { path: `/api/bookings/${b2Id}/review`, method: 'POST', headers: { Authorization: `Bearer ${cust2Token}` } },
      { rating: 4, comment: 'Very good pitch, clean locker rooms.' }
    );
    check('Bob submits verified turf review (4 stars)', r2Res.status === 201);

    // Verify dynamic recalculation in listTurfs
    const turfList2 = await req({ path: `/api/turfs`, method: 'GET' });
    const foundTurf2 = turfList2.body.find((t) => t.turf_id === turfId);
    check('Average rating updated to dynamic 4.50 ((5+4)/2)', Number(foundTurf2?.average_rating) === 4.5);
    check('Review count dynamically updated to 2', Number(foundTurf2?.review_count) === 2);

    // Verify detail page API returns reviews with customer names
    const turfDetail = await req({ path: `/api/turfs/${turfId}`, method: 'GET' });
    check('GET /api/turfs/:id returns average_rating 4.50', Number(turfDetail.body.average_rating) === 4.5);
    check('GET /api/turfs/:id returns 2 reviews', turfDetail.body.reviews?.length === 2);
    check('Reviews contain Alice review comment and name', turfDetail.body.reviews?.some((r) => r.customer_name === 'Player Alice' && r.rating === 5));
    check('Reviews contain Bob review comment and name', turfDetail.body.reviews?.some((r) => r.customer_name === 'Player Bob' && r.rating === 4));

    // -------------------------------------------------------------
    // Test 2: Dynamic Product Ratings & Reviews
    // -------------------------------------------------------------
    console.log('\n--- Test Suite 2: Dynamic Product Ratings & Reviews ---');

    const prodList1 = await req({ path: `/api/products`, method: 'GET' });
    const foundProd1 = prodList1.body.find((p) => p.product_id === productId);
    check('New product in marketplace has null avg_rating', foundProd1?.avg_rating === null);
    check('New product has review_count 0', Number(foundProd1?.review_count || 0) === 0);

    // Alice orders product
    const o1Res = await req(
      { path: '/api/orders', method: 'POST', headers: { Authorization: `Bearer ${cust1Token}` } },
      { items: [{ product_id: productId, qty: 1 }], delivery_address: 'Dhanmondi 27, Dhaka' }
    );
    const order1 = o1Res.body.order || o1Res.body;

    // Bob orders product
    const o2Res = await req(
      { path: '/api/orders', method: 'POST', headers: { Authorization: `Bearer ${cust2Token}` } },
      { items: [{ product_id: productId, qty: 1 }], delivery_address: 'Gulshan 1, Dhaka' }
    );
    const order2 = o2Res.body.order || o2Res.body;

    // Alice reviews product with 5 stars
    const pr1Res = await req(
      {
        path: `/api/orders/${order1.order_id}/items/${productId}/review`,
        method: 'POST',
        headers: { Authorization: `Bearer ${cust1Token}` },
      },
      { rating: 5, comment: 'Excellent shin guards, lightweight and durable!' }
    );
    check('Alice reviews product with 5 stars', pr1Res.status === 201);

    // Bob reviews product with 3 stars
    const pr2Res = await req(
      {
        path: `/api/orders/${order2.order_id}/items/${productId}/review`,
        method: 'POST',
        headers: { Authorization: `Bearer ${cust2Token}` },
      },
      { rating: 3, comment: 'Decent protection, straps are a bit snug.' }
    );
    check('Bob reviews product with 3 stars', pr2Res.status === 201);

    // Verify dynamic recalculation in listProducts
    const prodList2 = await req({ path: `/api/products`, method: 'GET' });
    const foundProd2 = prodList2.body.find((p) => p.product_id === productId);
    check('Product avg_rating updated to dynamic 4.00 ((5+3)/2)', Number(foundProd2?.avg_rating) === 4);
    check('Product review_count updated to 2', Number(foundProd2?.review_count) === 2);

    // Verify product detail API
    const prodDetail = await req({ path: `/api/products/${productId}`, method: 'GET' });
    check('Product detail returns avg_rating 4.00', Number(prodDetail.body.avg_rating) === 4);
    check('Product detail returns review_count 2', Number(prodDetail.body.review_count) === 2);
    check('Product detail reviews list contains customer names', prodDetail.body.reviews?.some((r) => r.customer_name === 'Player Alice'));

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log(`\n========================================`);
    console.log(`Phase 7 Tests Complete: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    server.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal test error:', err);
    server.close();
    process.exit(1);
  }
}

runDynamicUITests();
