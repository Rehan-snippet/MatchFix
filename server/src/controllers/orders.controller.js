const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// POST /api/orders  (customer)
// body: { items: [{ product_id, qty }], delivery_address, delivery_phone }
// "places": Order always belongs to exactly one Customer.
// "includes"/"listedAs": Order_Item borrows (order_id, product_id) as its
// key — unit_price is snapshotted here so later Product.price changes
// don't rewrite history.
const createOrder = asyncHandler(async (req, res) => {
  const { items, delivery_address, delivery_phone } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'items must be a non-empty array of { product_id, qty }');
  }
  if (!delivery_address) throw new ApiError(400, 'delivery_address is required');

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    let total = 0;
    const priced = [];
    for (const item of items) {
      if (!item.product_id || !item.qty || item.qty < 1) {
        throw new ApiError(400, 'Each item needs product_id and qty >= 1');
      }
      const { rows } = await client.query(
        'SELECT * FROM products WHERE product_id = $1 FOR UPDATE',
        [item.product_id]
      );
      const product = rows[0];
      if (!product || !product.is_active) throw new ApiError(404, `Product ${item.product_id} not available`);
      if (product.stock < item.qty) throw new ApiError(400, `Not enough stock for "${product.title}"`);

      total += Number(product.price) * item.qty;
      priced.push({ ...item, unit_price: product.price });
    }

    const orderRes = await client.query(
      `INSERT INTO orders (customer_id, total, delivery_address, delivery_phone)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.user.user_id, total, delivery_address, delivery_phone || null]
    );
    const order = orderRes.rows[0];

    for (const item of priced) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, qty, unit_price) VALUES ($1,$2,$3,$4)`,
        [order.order_id, item.product_id, item.qty, item.unit_price]
      );
      await client.query('UPDATE products SET stock = stock - $1 WHERE product_id = $2', [
        item.qty,
        item.product_id,
      ]);
    }

    await client.query('COMMIT');
    res.status(201).json(order);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

async function attachItems(orders) {
  return Promise.all(
    orders.map(async (order) => {
      const { rows } = await db.query(
        `SELECT oi.*, p.title, p.seller_id FROM order_items oi
         JOIN products p ON p.product_id = oi.product_id
         WHERE oi.order_id = $1`,
        [order.order_id]
      );
      return { ...order, items: rows };
    })
  );
}

// GET /api/orders/mine  (customer)
const listMyOrders = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC', [
    req.user.user_id,
  ]);
  res.json(await attachItems(rows));
});

// GET /api/orders/for-my-products  (seller) — order lines containing their products
const listOrdersForMyProducts = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT oi.*, o.order_id, o.delivery_address, o.delivery_phone, o.created_at AS order_created_at,
            p.title, u.name AS customer_name
     FROM order_items oi
     JOIN products p ON p.product_id = oi.product_id
     JOIN orders o ON o.order_id = oi.order_id
     JOIN customers c ON c.user_id = o.customer_id
     JOIN users u ON u.user_id = c.user_id
     WHERE p.seller_id = $1
     ORDER BY o.created_at DESC`,
    [req.user.user_id]
  );
  res.json(rows);
});

// PATCH /api/orders/:orderId/items/:productId/status  (seller) { status }
const updateOrderItemStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['placed', 'confirmed', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) throw new ApiError(400, `status must be one of ${allowed.join(', ')}`);

  const ownerCheck = await db.query(
    `SELECT p.seller_id FROM order_items oi JOIN products p ON p.product_id = oi.product_id
     WHERE oi.order_id = $1 AND oi.product_id = $2`,
    [req.params.orderId, req.params.productId]
  );
  if (!ownerCheck.rows[0]) throw new ApiError(404, 'Order item not found');
  if (ownerCheck.rows[0].seller_id !== req.user.user_id) throw new ApiError(403, 'Not your product');

  const { rows } = await db.query(
    `UPDATE order_items SET status = $1 WHERE order_id = $2 AND product_id = $3 RETURNING *`,
    [status, req.params.orderId, req.params.productId]
  );
  res.json(rows[0]);
});

// POST /api/orders/:orderId/items/:productId/review  (owning customer) { rating, comment } -- "rated"
const reviewOrderItem = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) throw new ApiError(400, 'rating must be between 1 and 5');

  const order = await db.query('SELECT * FROM orders WHERE order_id = $1', [req.params.orderId]);
  if (!order.rows[0]) throw new ApiError(404, 'Order not found');
  if (order.rows[0].customer_id !== req.user.user_id) throw new ApiError(403, 'Not your order');

  const { rows } = await db.query(
    `INSERT INTO product_reviews (order_id, product_id, rating, comment) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.params.orderId, req.params.productId, rating, comment || null]
  );
  res.status(201).json(rows[0]);
});

module.exports = {
  createOrder,
  listMyOrders,
  listOrdersForMyProducts,
  updateOrderItemStatus,
  reviewOrderItem,
};
