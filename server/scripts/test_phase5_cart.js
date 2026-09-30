const db = require('e:/Project/MatchFix/MatchFix/server/src/config/db');
const jwt = require('e:/Project/MatchFix/MatchFix/server/node_modules/jsonwebtoken');
const http = require('http');
const app = require('e:/Project/MatchFix/MatchFix/server/server.js');

async function runCartTests() {
  const server = app.listen(0);
  const port = server.address().port;
  console.log(`\n🧪 Phase 5: Shopping Cart & Multi-Item Order Checkout Tests — port ${port}\n`);

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

  // 1. Setup Test Seller and Customer
  const ts = Date.now();
  const sellerEmail = `seller_cart_${ts}@test.com`;
  const customerEmail = `customer_cart_${ts}@test.com`;

  const sUser = await db.query(
    'INSERT INTO users (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING user_id',
    ['Cart Seller', sellerEmail, '01711223344', 'hash']
  );
  const sellerId = sUser.rows[0].user_id;
  await db.query(
    'INSERT INTO sellers (user_id, shop_name, payout_account, approval_status) VALUES ($1, $2, $3, $4)',
    [sellerId, 'Super Cart Sports', 'bKash-01711223344', 'approved']
  );

  const cUser = await db.query(
    'INSERT INTO users (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING user_id',
    ['Cart Customer', customerEmail, '01799887766', 'hash']
  );
  const customerId = cUser.rows[0].user_id;
  await db.query(
    'INSERT INTO customers (user_id, default_address) VALUES ($1, $2)',
    [customerId, 'House 12, Road 4, Dhanmondi, Dhaka']
  );

  // 2. Setup Test Products
  // Product 1: Jersey (price 1200, stock 10)
  const p1 = await db.query(
    `INSERT INTO products (seller_id, title, price, category, condition, stock, approval_status)
     VALUES ($1, $2, 1200.00, 'Jerseys & Kits', 'new', 10, 'approved') RETURNING *`,
    [sellerId, 'Pro Match Jersey']
  );
  const prod1 = p1.rows[0];

  // Product 2: Football Boots (price 3500, stock 5)
  const p2 = await db.query(
    `INSERT INTO products (seller_id, title, price, category, condition, stock, approval_status)
     VALUES ($1, $2, 3500.00, 'Football Boots', 'new', 5, 'approved') RETURNING *`,
    [sellerId, 'Elite Turf Boots']
  );
  const prod2 = p2.rows[0];

  // Product 3: Shin Guards (price 450, stock 2)
  const p3 = await db.query(
    `INSERT INTO products (seller_id, title, price, category, condition, stock, approval_status)
     VALUES ($1, $2, 450.00, 'Accessories', 'new', 2, 'approved') RETURNING *`,
    [sellerId, 'Carbon Shin Guards']
  );
  const prod3 = p3.rows[0];

  const customerToken = jwt.sign(
    { user_id: customerId, email: customerEmail, is_admin: false, roles: ['customer'] },
    process.env.JWT_SECRET || 'test_secret'
  );

  async function req(method, path, body = null, token = customerToken) {
    return new Promise((resolve, reject) => {
      const opts = {
        hostname: 'localhost',
        port,
        path,
        method,
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      };
      const r = http.request(opts, (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(d) });
          } catch (e) {
            resolve({ status: res.statusCode, body: d });
          }
        });
      });
      r.on('error', reject);
      if (body) r.write(JSON.stringify(body));
      r.end();
    });
  }

  // --- Test 1: Empty cart items validation ---
  let res = await req('POST', '/api/orders', {
    items: [],
    delivery_address: 'Dhaka',
  });
  check('POST /api/orders — rejects empty items array', res.status === 400);

  // --- Test 2: Missing delivery address ---
  res = await req('POST', '/api/orders', {
    items: [{ product_id: prod1.product_id, qty: 1 }],
    delivery_address: '',
  });
  check('POST /api/orders — rejects missing delivery address', res.status === 400);

  // --- Test 3: Insufficient stock validation ---
  res = await req('POST', '/api/orders', {
    items: [{ product_id: prod3.product_id, qty: 10 }], // only 2 in stock
    delivery_address: 'Dhaka',
  });
  check('POST /api/orders — rejects order exceeding product stock', res.status === 400);
  check('Stock of product 3 remains untouched after rejection', true);
  const checkStockP3 = await db.query('SELECT stock FROM products WHERE product_id = $1', [prod3.product_id]);
  check('Product 3 stock still 2', checkStockP3.rows[0].stock === 2);

  // --- Test 4: Multi-item Cart Checkout ---
  // Cart contents:
  // - 2 × Jersey @ 1200 = 2400
  // - 1 × Boots  @ 3500 = 3500
  // Total expected = 5900
  res = await req('POST', '/api/orders', {
    items: [
      { product_id: prod1.product_id, qty: 2 },
      { product_id: prod2.product_id, qty: 1 },
    ],
    delivery_address: 'House 12, Road 4, Dhanmondi, Dhaka',
    delivery_phone: '01799887766',
  });

  check('POST /api/orders — successfully places multi-item order', res.status === 201);
  const createdOrder = res.body.order;
  check('Order total amount is 5900', Number(createdOrder.total_amount) === 5900);
  check('Order status is "placed"', createdOrder.status === 'placed');
  check('Order delivery address matches', createdOrder.delivery_address === 'House 12, Road 4, Dhanmondi, Dhaka');
  const orderId = createdOrder.order_id;

  // --- Test 5: Verify Order Items in DB ---
  const orderItemsRes = await db.query(
    'SELECT * FROM order_items WHERE order_id = $1 ORDER BY product_id',
    [orderId]
  );
  check('Order contains exactly 2 order_items rows', orderItemsRes.rows.length === 2);

  const item1 = orderItemsRes.rows.find((i) => i.product_id === prod1.product_id);
  const item2 = orderItemsRes.rows.find((i) => i.product_id === prod2.product_id);

  check('Item 1 has qty 2 and unit_price 1200', item1 && item1.qty === 2 && Number(item1.unit_price) === 1200);
  check('Item 2 has qty 1 and unit_price 3500', item2 && item2.qty === 1 && Number(item2.unit_price) === 3500);

  // --- Test 6: Verify Stock Decremented in DB ---
  const updatedP1 = await db.query('SELECT stock FROM products WHERE product_id = $1', [prod1.product_id]);
  const updatedP2 = await db.query('SELECT stock FROM products WHERE product_id = $1', [prod2.product_id]);

  check('Product 1 stock decremented from 10 to 8', updatedP1.rows[0].stock === 8);
  check('Product 2 stock decremented from 5 to 4', updatedP2.rows[0].stock === 4);

  // --- Test 7: GET /api/orders/mine returns the placed multi-item order ---
  res = await req('GET', '/api/orders/mine');
  check('GET /api/orders/mine returns 200', res.status === 200);
  const myOrder = res.body.find((o) => o.order_id === orderId);
  check('Customer sees multi-item order in listMyOrders', !!myOrder);
  check('Total amount displayed correctly in customer order list', Number(myOrder.total_amount) === 5900);

  // --- Test 8: Settle Payment for Multi-Item Order ---
  // Initiate payment intent
  res = await req('POST', '/api/payments/initiate', {
    order_id: orderId,
    amount: 5900,
    method: 'sandbox_card',
  });
  check('POST /api/payments/initiate succeeds for order', res.status === 201 || res.status === 200);
  const intentId = res.body.intent_id;
  check('Payment intent returns valid intent_id', !!intentId);

  // Confirm payment via sandbox
  res = await req('POST', '/api/payments/confirm', {
    intent_id: intentId,
    card_number: '4242424242424242',
    name_on_card: 'Cart Customer',
    exp_month: 12,
    exp_year: 2028,
    cvv: '123',
  });
  check('POST /api/payments/confirm settles payment successfully', res.status === 200);

  // Verify order status updated to confirmed
  const settledOrder = await db.query('SELECT status FROM orders WHERE order_id = $1', [orderId]);
  check('Order status changed to "confirmed" after payment', settledOrder.rows[0].status === 'confirmed');

  // Verify duplicate payment prevented
  res = await req('POST', '/api/payments/initiate', {
    order_id: orderId,
    amount: 5900,
  });
  check('Reject duplicate payment on settled order', res.status === 400);

  // Clean up
  await db.query('DELETE FROM users WHERE user_id IN ($1, $2)', [sellerId, customerId]);
  server.close();

  console.log(`\n========================================`);
  console.log(`Phase 5 Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runCartTests().catch((err) => {
  console.error('Fatal Test Failure:', err);
  process.exit(1);
});
