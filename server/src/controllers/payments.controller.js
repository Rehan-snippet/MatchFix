const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// POST /api/payments  (customer)
// body: { booking_id?, order_id?, amount, purpose, method, trx_id }
// Exactly one of booking_id / order_id must be provided — mirrors the
// either/or design note ("A Payment settles a booking or an order, never
// both") which the schema's CHECK constraint also enforces at the DB level.
const createPayment = asyncHandler(async (req, res) => {
  const { booking_id, order_id, amount, purpose, method, trx_id } = req.body;

  if ((booking_id && order_id) || (!booking_id && !order_id)) {
    throw new ApiError(400, 'Provide exactly one of booking_id or order_id');
  }
  if (amount === undefined || !purpose || !method) {
    throw new ApiError(400, 'amount, purpose and method are required');
  }

  if (booking_id) {
    const { rows } = await db.query('SELECT * FROM bookings WHERE booking_id = $1', [booking_id]);
    if (!rows[0]) throw new ApiError(404, 'Booking not found');
    if (rows[0].customer_id !== req.user.user_id) throw new ApiError(403, 'Not your booking');
  } else {
    const { rows } = await db.query('SELECT * FROM orders WHERE order_id = $1', [order_id]);
    if (!rows[0]) throw new ApiError(404, 'Order not found');
    if (rows[0].customer_id !== req.user.user_id) throw new ApiError(403, 'Not your order');
  }

  const { rows } = await db.query(
    `INSERT INTO payments (booking_id, order_id, amount, purpose, method, trx_id, paid_at, status)
     VALUES ($1,$2,$3,$4,$5,$6, now(), 'success') RETURNING *`,
    [booking_id || null, order_id || null, amount, purpose, method, trx_id || null]
  );

  // Booking bookings move to 'confirmed' once at least one payment lands.
  if (booking_id) {
    await db.query(`UPDATE bookings SET status = 'confirmed' WHERE booking_id = $1 AND status = 'pending'`, [
      booking_id,
    ]);
  }

  res.status(201).json(rows[0]);
});

// GET /api/payments?booking_id=  or  ?order_id=
const listPayments = asyncHandler(async (req, res) => {
  const { booking_id, order_id } = req.query;
  if (!booking_id && !order_id) throw new ApiError(400, 'Provide booking_id or order_id');

  const { rows } = await db.query(
    `SELECT * FROM payments WHERE booking_id = $1 OR order_id = $2 ORDER BY paid_at DESC NULLS LAST`,
    [booking_id || null, order_id || null]
  );
  res.json(rows);
});

module.exports = { createPayment, listPayments };
