const db = require('../config/db');

/**
 * POST /api/payments
 * DML 24: Uses withTransaction to execute sp_record_payment.
 */
async function createPayment(req, res) {
  const { booking_id, order_id, amount, method, purpose } = req.body;

  if (!booking_id && !order_id) {
    return res.status(400).json({ error: 'Must provide either booking_id OR order_id.' });
  }
  if (booking_id && order_id) {
    return res.status(400).json({ error: 'Payment cannot settle both booking and order at the same time.' });
  }
  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Payment amount must be greater than zero.' });
  }

  try {
    const payment = await db.withTransaction(async (client) => {
      const result = await client.query(
        'CALL sp_record_payment($1, $2, $3, $4, $5, $6, NULL)',
        [
          req.user.user_id,
          booking_id ? Number(booking_id) : null,
          order_id ? Number(order_id) : null,
          Number(amount),
          method || 'card',
          purpose || 'full',
        ]
      );

      return {
        payment_id: result.rows[0]?.p_payment_id,
        status: 'completed',
      };
    });

    return res.status(201).json({
      ...payment,
      message: 'Payment verified and settled successfully.',
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * GET /api/payments
 */
async function listPayments(req, res) {
  const { booking_id, order_id } = req.query;

  try {
    let queryText = `
      SELECT p.*
      FROM payments p
      LEFT JOIN bookings b ON p.booking_id = b.booking_id
      LEFT JOIN orders o ON p.order_id = o.order_id
      WHERE (b.customer_id = $1 OR o.customer_id = $1)
    `;
    const params = [req.user.user_id];

    if (booking_id) {
      params.push(booking_id);
      queryText += ` AND p.booking_id = $${params.length}`;
    }
    if (order_id) {
      params.push(order_id);
      queryText += ` AND p.order_id = $${params.length}`;
    }

    queryText += ` ORDER BY p.created_at DESC`;

    const { rows } = await db.query(queryText, params);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createPayment,
  listPayments,
};