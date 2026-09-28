const db = require('../config/db');
/**
 * POST /api/orders
 * DML 31: Uses withTransaction to enforce ACID checkout.
 * Row-locks products using FOR UPDATE, verifies stock, decrements inventory,
 * and creates order + order_items atomically.
 */
async function createOrder(req, res) {
  const { items, delivery_address, delivery_phone } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one item.' });
  }
  if (!delivery_address) {
    return res.status(400).json({ error: 'Delivery address is required.' });
  }

  try {
    const order = await db.withTransaction(async (client) => {
      let totalAmount = 0;
      const verifiedItems = [];

      for (const item of items) {
        const { product_id, qty } = item;
        if (!product_id || !qty || qty <= 0) {
          throw new Error('Each item must have a valid product_id and quantity > 0.');
        }

        // Lock row to prevent race conditions during concurrent orders
        const { rows } = await client.query(
          `SELECT product_id, title, price, stock
           FROM products
           WHERE product_id = $1
           FOR UPDATE`,
          [product_id]
        );

        if (!rows.length) throw new Error(`Product #${product_id} not found.`);
        const prod = rows[0];

        if (prod.stock < qty) {
          throw new Error(`Insufficient stock for "${prod.title}". In stock: ${prod.stock}, requested: ${qty}.`);
        }

        const unitPrice = Number(prod.price);
        totalAmount += unitPrice * qty;

        // Decrement stock
        await client.query(
          `UPDATE products SET stock = stock - $1 WHERE product_id = $2`,
          [qty, product_id]
        );

        verifiedItems.push({
          product_id,
          qty,
          unit_price: unitPrice,
        });
      }

      // Create Order
      const orderRes = await client.query(
        `INSERT INTO orders (customer_id, total_amount, status, delivery_address, delivery_phone)
         VALUES ($1, $2, 'placed', $3, $4)
         RETURNING *`,
        [req.user.user_id, totalAmount, delivery_address, delivery_phone || null]
      );
      const createdOrder = orderRes.rows[0];

      // Insert Order Items
      for (const vItem of verifiedItems) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, qty, unit_price, status)
           VALUES ($1, $2, $3, $4, 'placed')`,
          [createdOrder.order_id, vItem.product_id, vItem.qty, vItem.unit_price]
        );
      }

      return createdOrder;
    });

    return res.status(201).json({
      order,
      message: 'Order placed successfully. Please settle payment to confirm shipment.',
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * GET /api/orders/mine
 */
async function listMyOrders(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT
        o.order_id,
        o.total_amount,
        o.status,
        o.delivery_address,
        o.delivery_phone,
        o.created_at,
        json_agg(
          json_build_object(
            'product_id', p.product_id,
            'title', p.title,
            'qty', oi.qty,
            'unit_price', oi.unit_price,
            'status', oi.status
          )
        ) AS items,
        (
          SELECT json_agg(json_build_object('payment_id', pay.payment_id, 'amount', pay.amount, 'status', pay.status))
          FROM payments pay WHERE pay.order_id = o.order_id
        ) AS payments
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN products p ON oi.product_id = p.product_id
      WHERE o.customer_id = $1
      GROUP BY o.order_id
      ORDER BY o.created_at DESC`,
      [req.user.user_id]
    );

    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/orders/for-my-products
 */
async function listOrdersForMyProducts(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT
        o.order_id,
        o.status AS order_status,
        o.created_at,
        u.name AS customer_name,
        u.phone AS customer_phone,
        o.delivery_address,
        oi.product_id,
        p.title AS product_title,
        oi.qty,
        oi.unit_price,
        oi.status AS item_status
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      JOIN products p ON oi.product_id = p.product_id
      JOIN users u ON o.customer_id = u.user_id
      WHERE p.seller_id = $1
      ORDER BY o.created_at DESC`,
      [req.user.user_id]
    );

    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/orders/:id/cancel
 * DML 32: Uses withTransaction to cancel order and return reserved stock to products.
 */
async function cancelOrder(req, res) {
  const { id } = req.params;

  try {
    await db.withTransaction(async (client) => {
      const check = await client.query('SELECT customer_id, status FROM orders WHERE order_id = $1 FOR UPDATE', [id]);
      if (!check.rows.length) throw new Error('Order not found.');
      const order = check.rows[0];

      if (!req.user.is_admin && order.customer_id !== req.user.user_id) throw new Error('Unauthorized.');
      if (['cancelled', 'shipped', 'delivered'].includes(order.status)) {
        throw new Error(`Cannot cancel order in "${order.status}" status.`);
      }

      // Restore product stock
      const { rows: items } = await client.query(
        'SELECT product_id, qty FROM order_items WHERE order_id = $1',
        [id]
      );
      for (const item of items) {
        await client.query(
          'UPDATE products SET stock = stock + $1 WHERE product_id = $2',
          [item.qty, item.product_id]
        );
      }

      await client.query(`UPDATE orders SET status = 'cancelled' WHERE order_id = $1`, [id]);
      await client.query(`UPDATE order_items SET status = 'cancelled' WHERE order_id = $1`, [id]);
    });

    return res.json({ message: 'Order cancelled successfully and stock restored.' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * PATCH /api/orders/:orderId/items/:productId/status (or /:id/status)
 * DML 33: Uses withTransaction
 */
async function updateOrderStatus(req, res) {
  const orderId = req.params.orderId || req.params.id;
  const productId = req.params.productId;
  const { status } = req.body;

  const validStatuses = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    await db.withTransaction(async (client) => {
      if (productId) {
        // Seller ownership check: seller must own this product (or admin)
        if (!req.user.is_admin) {
          const prodCheck = await client.query('SELECT seller_id FROM products WHERE product_id = $1', [productId]);
          if (!prodCheck.rows.length || prodCheck.rows[0].seller_id !== req.user.user_id) {
            throw new Error('Unauthorized: You do not own this product.');
          }
        }

        const resItem = await client.query(
          'UPDATE order_items SET status = $1 WHERE order_id = $2 AND product_id = $3 RETURNING *',
          [status, orderId, productId]
        );
        if (resItem.rowCount === 0) throw new Error('Order item not found.');

        // Synchronize parent order status if all items have matching statuses
        const { rows: allItems } = await client.query(
          'SELECT status FROM order_items WHERE order_id = $1',
          [orderId]
        );
        if (allItems.length > 0) {
          if (allItems.every((i) => i.status === 'delivered')) {
            await client.query('UPDATE orders SET status = $1 WHERE order_id = $2', ['delivered', orderId]);
          } else if (allItems.every((i) => i.status === 'cancelled')) {
            await client.query('UPDATE orders SET status = $1 WHERE order_id = $2', ['cancelled', orderId]);
          } else if (allItems.some((i) => i.status === 'shipped')) {
            await client.query('UPDATE orders SET status = $1 WHERE order_id = $2', ['shipped', orderId]);
          } else if (allItems.some((i) => i.status === 'confirmed')) {
            await client.query('UPDATE orders SET status = $1 WHERE order_id = $2', ['confirmed', orderId]);
          }
        }
      } else {
        // Fallback for updating entire order (admin or legacy)
        const resUpdate = await client.query('UPDATE orders SET status = $1 WHERE order_id = $2', [status, orderId]);
        if (resUpdate.rowCount === 0) throw new Error('Order not found.');
        await client.query('UPDATE order_items SET status = $1 WHERE order_id = $2', [status, orderId]);
      }
    });

    return res.json({ message: `Order status updated to ${status}.` });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * POST /api/orders/:orderId/products/:productId/review
 * DML 34: Uses withTransaction
 */
async function addProductReview(req, res) {
  const { orderId, productId } = req.params;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
  }

  try {
    const review = await db.withTransaction(async (client) => {
      // Validate customer purchased this product in this order
      const { rows } = await client.query(
        `SELECT o.customer_id, o.status
         FROM orders o
         JOIN order_items oi ON o.order_id = oi.order_id
         WHERE o.order_id = $1 AND oi.product_id = $2`,
        [orderId, productId]
      );

      if (!rows.length) throw new Error('No purchase record found for this product in this order.');
      if (rows[0].customer_id !== req.user.user_id) throw new Error('Unauthorized to review this order item.');
      if (rows[0].status === 'cancelled') throw new Error('Cannot review a cancelled order.');

      const resReview = await client.query(
        `INSERT INTO product_reviews (order_id, product_id, rating, comment, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (order_id, product_id) DO UPDATE SET rating = $3, comment = $4
         RETURNING *`,
        [orderId, productId, rating, comment]
      );
      return resReview.rows[0];
    });

    return res.status(201).json(review);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

module.exports = {
  createOrder,
  listMyOrders,
  listOrdersForMyProducts,
  cancelOrder,
  updateOrderStatus,
  addProductReview,
};