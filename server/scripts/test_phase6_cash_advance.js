const db = require('../src/config/db');
const { sign } = require('../src/utils/jwt');
const http = require('http');
const app = require('../server.js');

async function runCashAdvanceTests() {
  const server = app.listen(0);
  const port = server.address().port;
  console.log(`\n🧪 Phase 6: Cash Payment with Online Advance Tests — port ${port}\n`);

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

  // 1. Setup Test Users: Organizer, Seller, Customer
  const organizerEmail = `org_phase6_${ts}@test.com`;
  const sellerEmail = `seller_phase6_${ts}@test.com`;
  const customerEmail = `cust_phase6_${ts}@test.com`;

  // Organizer
  const orgUser = await db.query(
    'INSERT INTO users (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING user_id',
    ['Phase6 Organizer', organizerEmail, '01711000001', 'hash']
  );
  const organizerId = orgUser.rows[0].user_id;
  await db.query(
    'INSERT INTO organizers (user_id, trade_licence, payout_account, approval_status) VALUES ($1, $2, $3, $4)',
    [organizerId, 'TRAD-12345', 'bKash-01711000001', 'approved']
  );

  // Seller
  const selUser = await db.query(
    'INSERT INTO users (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING user_id',
    ['Phase6 Seller', sellerEmail, '01711000002', 'hash']
  );
  const sellerId = selUser.rows[0].user_id;
  await db.query(
    'INSERT INTO sellers (user_id, shop_name, payout_account, approval_status) VALUES ($1, $2, $3, $4)',
    [sellerId, 'Phase6 Gear Store', 'bKash-01711000002', 'approved']
  );

  // Customer
  const custUser = await db.query(
    'INSERT INTO users (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING user_id',
    ['Phase6 Customer', customerEmail, '01711000003', 'hash']
  );
  const customerId = custUser.rows[0].user_id;
  await db.query(
    'INSERT INTO customers (user_id, default_address) VALUES ($1, $2)',
    [customerId, 'Flat 4A, Banani Road 11, Dhaka']
  );

  // Auth tokens
  const orgToken = sign({ user_id: organizerId, roles: ['organizer'], is_admin: false });
  const sellerToken = sign({ user_id: sellerId, roles: ['seller'], is_admin: false });
  const custToken = sign({ user_id: customerId, roles: ['customer'], is_admin: false });

  // Setup Turf, Field, Slot
  const areaRes = await db.query('SELECT area_id FROM areas LIMIT 1');
  const areaId = areaRes.rows[0].area_id;

  const turfRes = await db.query(
    `INSERT INTO turfs (organizer_id, area_id, name, address, hourly_rate, approval_status)
     VALUES ($1, $2, $3, $4, 2000.00, 'approved') RETURNING turf_id`,
    [organizerId, areaId, 'Cash Advance Arena', 'Gulshan 2, Dhaka']
  );
  const turfId = turfRes.rows[0].turf_id;

  const fieldRes = await db.query(
    `INSERT INTO fields (turf_id, name, surface, side_type)
     VALUES ($1, 'Main Pitch', 'Artificial Turf', '7v7') RETURNING field_id`,
    [turfId]
  );
  const fieldId = fieldRes.rows[0].field_id;

  // Setup Product
  const prodRes = await db.query(
    `INSERT INTO products (seller_id, title, price, category, condition, stock, approval_status)
     VALUES ($1, 'Match Official Ball', 3000.00, 'Equipment', 'new', 20, 'approved') RETURNING product_id`,
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
    // Test 1: Turf Booking with Cash Advance (Cash at Venue)
    // -------------------------------------------------------------
    console.log('--- Test Suite 1: Turf Booking with 20% Online Advance & Cash at Venue ---');

    // Step 1: Customer creates booking with payment_method: 'cash_advance'
    const bRes = await req(
      {
        path: '/api/bookings',
        method: 'POST',
        headers: { Authorization: `Bearer ${custToken}` },
      },
      {
        slots: [
          {
            field_id: fieldId,
            slot_date: '2026-11-20',
            start_time: '18:00:00',
            end_time: '19:00:00',
          },
        ],
        payment_method: 'cash_advance',
      }
    );

    check('Booking created with payment_method cash_advance', bRes.status === 201);
    const booking = bRes.body;
    check('Booking initial status is pending', booking.status === 'pending');
    check('Booking payment_method is cash_advance', booking.payment_method === 'cash_advance');
    check('Booking advance_amount calculated as 20% (৳400)', Number(booking.advance_amount) === 400);
    check('Booking cash_balance calculated as 80% (৳1600)', Number(booking.cash_balance) === 1600);

    // Step 2: Validate edge cases on payment intent initiation
    // A: Full amount intent with purpose: 'advance' should fail
    const badIntent1 = await req(
      {
        path: '/api/payments/initiate',
        method: 'POST',
        headers: { Authorization: `Bearer ${custToken}` },
      },
      {
        booking_id: booking.booking_id,
        amount: 2000,
        purpose: 'advance',
      }
    );
    check('Payment initiate rejects full amount when purpose is advance', badIntent1.status === 400);

    // B: Partial amount intent with purpose: 'full' should fail
    const badIntent2 = await req(
      {
        path: '/api/payments/initiate',
        method: 'POST',
        headers: { Authorization: `Bearer ${custToken}` },
      },
      {
        booking_id: booking.booking_id,
        amount: 400,
        purpose: 'full',
      }
    );
    check('Payment initiate rejects partial amount when purpose is full', badIntent2.status === 400);

    // Step 3: Initiate valid advance payment intent (৳400, purpose: 'advance')
    const intentRes = await req(
      {
        path: '/api/payments/initiate',
        method: 'POST',
        headers: { Authorization: `Bearer ${custToken}` },
      },
      {
        booking_id: booking.booking_id,
        amount: 400,
        purpose: 'advance',
      }
    );
    check('Payment intent initiated for 20% advance (৳400)', intentRes.status === 201 && intentRes.body.intent_id);
    const intentId = intentRes.body.intent_id;

    // Step 4: Confirm sandbox advance payment
    const confirmRes = await req(
      {
        path: '/api/payments/confirm',
        method: 'POST',
        headers: { Authorization: `Bearer ${custToken}` },
      },
      {
        intent_id: intentId,
        card_number: '4242424242424242',
      }
    );
    check('Sandbox advance payment confirmed', confirmRes.status === 200 && confirmRes.body.success === true);

    // Step 5: Check database booking status is now 'advance_paid'
    const dbB1 = await db.query('SELECT * FROM bookings WHERE booking_id = $1', [booking.booking_id]);
    const bUpdated = dbB1.rows[0];
    check('Booking status updated to advance_paid', bUpdated.status === 'advance_paid');
    check('Booking advance_amount is 400', Number(bUpdated.advance_amount) === 400);
    check('Booking cash_balance is 1600', Number(bUpdated.cash_balance) === 1600);

    // Verify payment record in database has is_advance = true
    const payRows = await db.query('SELECT * FROM payments WHERE booking_id = $1', [booking.booking_id]);
    check('Payment record created with is_advance = TRUE', payRows.rows.length === 1 && payRows.rows[0].is_advance === true);
    check('Payment record amount is 400', Number(payRows.rows[0].amount) === 400);

    // Step 6: Organizer views bookings for their turfs
    const orgBookingsRes = await req({
      path: '/api/bookings/for-my-turfs',
      method: 'GET',
      headers: { Authorization: `Bearer ${orgToken}` },
    });
    check('Organizer can retrieve bookings for their turfs', orgBookingsRes.status === 200);
    const orgB = orgBookingsRes.body.find((x) => x.booking_id === booking.booking_id);
    check('Organizer sees advance_paid booking with cash_balance 1600', orgB && orgB.status === 'advance_paid' && Number(orgB.cash_balance) === 1600);

    // Step 7: Unauthorized user attempts to collect cash
    const unauthCollect = await req({
      path: `/api/bookings/${booking.booking_id}/collect-cash`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${custToken}` },
    });
    check('Customer cannot collect cash (403 forbidden)', unauthCollect.status === 403);

    // Step 8: Organizer collects remaining cash at the venue
    const collectRes = await req({
      path: `/api/bookings/${booking.booking_id}/collect-cash`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${orgToken}` },
    });
    check('Organizer successfully collects remaining cash at venue', collectRes.status === 200);

    // Verify booking is now 'confirmed' and cash_balance = 0
    const dbB2 = await db.query('SELECT * FROM bookings WHERE booking_id = $1', [booking.booking_id]);
    const bFinal = dbB2.rows[0];
    check('Booking status is now confirmed', bFinal.status === 'confirmed');
    check('Booking cash_balance is 0', Number(bFinal.cash_balance) === 0);

    // Verify two payment records exist (advance + cash balance)
    const payAll = await db.query('SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at ASC', [booking.booking_id]);
    check('Total 2 payment records recorded for booking', payAll.rows.length === 2);
    check('Second payment is cash payment of 1600', payAll.rows[1].method === 'cash' && Number(payAll.rows[1].amount) === 1600);

    // -------------------------------------------------------------
    // Test 2: Marketplace Order with COD Advance & Cash Collection
    // -------------------------------------------------------------
    console.log('\n--- Test Suite 2: Marketplace Order with COD Advance & Collection ---');

    // Step 1: Customer creates order with payment_method: 'cash_advance'
    const orderRes = await req(
      {
        path: '/api/orders',
        method: 'POST',
        headers: { Authorization: `Bearer ${custToken}` },
      },
      {
        items: [{ product_id: productId, qty: 1 }],
        delivery_address: 'House 15, Road 7, Uttara, Dhaka',
        payment_method: 'cash_advance',
      }
    );
    check('Order created with payment_method cash_advance', orderRes.status === 201);
    const order = orderRes.body.order || orderRes.body;
    check('Order initial status is placed', order.status === 'placed');
    check('Order total is ৳3000', Number(order.total_amount || order.total) === 3000);
    check('Order advance_amount is ৳600 (20%)', Number(order.advance_amount) === 600);
    check('Order cash_balance is ৳2400 (80%)', Number(order.cash_balance) === 2400);

    // Step 2: Initiate advance payment intent for order (৳600, purpose: 'advance')
    const oIntentRes = await req(
      {
        path: '/api/payments/initiate',
        method: 'POST',
        headers: { Authorization: `Bearer ${custToken}` },
      },
      {
        order_id: order.order_id,
        amount: 600,
        purpose: 'advance',
      }
    );
    check('Order advance payment intent initiated for ৳600', oIntentRes.status === 201 && oIntentRes.body.intent_id);

    // Step 3: Confirm order advance payment
    const oConfirmRes = await req(
      {
        path: '/api/payments/confirm',
        method: 'POST',
        headers: { Authorization: `Bearer ${custToken}` },
      },
      {
        intent_id: oIntentRes.body.intent_id,
        card_number: '4242424242424242',
      }
    );
    check('Sandbox advance payment confirmed for order', oConfirmRes.status === 200 && oConfirmRes.body.success === true);

    // Verify order status in database is now 'advance_paid'
    const dbO1 = await db.query('SELECT * FROM orders WHERE order_id = $1', [order.order_id]);
    const oUpdated = dbO1.rows[0];
    check('Order status updated to advance_paid', oUpdated.status === 'advance_paid');
    check('Order cash_balance is 2400', Number(oUpdated.cash_balance) === 2400);

    // Step 4: Seller views orders for their products
    const sellerOrdersRes = await req({
      path: '/api/orders/for-my-products',
      method: 'GET',
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    check('Seller can retrieve customer orders', sellerOrdersRes.status === 200);
    const sellerOrder = sellerOrdersRes.body.find((x) => x.order_id === order.order_id);
    check('Seller sees advance_paid order with cash_balance 2400 and COD', sellerOrder && sellerOrder.order_status === 'advance_paid' && Number(sellerOrder.cash_balance) === 2400);

    // Step 5: Seller collects COD cash upon delivery
    const oCollectRes = await req({
      path: `/api/orders/${order.order_id}/collect-cash`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    check('Seller collects COD cash balance', oCollectRes.status === 200);

    // Verify order is now delivered and cash_balance = 0
    const dbO2 = await db.query('SELECT * FROM orders WHERE order_id = $1', [order.order_id]);
    const oFinal = dbO2.rows[0];
    check('Order status is now delivered', oFinal.status === 'delivered');
    check('Order cash_balance is 0', Number(oFinal.cash_balance) === 0);

    // Verify order_items are marked 'delivered'
    const itemRows = await db.query('SELECT status FROM order_items WHERE order_id = $1', [order.order_id]);
    check('All order items marked delivered', itemRows.rows.every((i) => i.status === 'delivered'));

    // Step 6: Collecting cash again should be rejected
    const repeatCollect = await req({
      path: `/api/orders/${order.order_id}/collect-cash`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    check('Subsequent collect-cash call rejected (no cash balance remaining)', repeatCollect.status === 400);

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log(`\n========================================`);
    console.log(`Phase 6 Tests Complete: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

    server.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal test error:', err);
    server.close();
    process.exit(1);
  }
}

runCashAdvanceTests();
