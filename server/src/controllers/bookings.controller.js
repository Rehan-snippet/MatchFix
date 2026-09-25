const db = require('../config/db');

/**
 * POST /api/bookings
 * DML 20: Uses withTransaction to execute procedure sp_create_booking.
 */
async function createBooking(req, res) {
  const { slots } = req.body;
  if (!Array.isArray(slots) || slots.length === 0) {
    return res.status(400).json({ error: 'Please provide at least one slot in slots array.' });
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  for (const slot of slots) {
    if (!slot.field_id || !slot.slot_date || !slot.start_time || !slot.end_time) {
      return res.status(400).json({ error: 'Each slot requires field_id, slot_date, start_time, and end_time.' });
    }
    if (slot.slot_date < todayStr) {
      return res.status(400).json({ error: 'Cannot book match slots in the past.' });
    }
  }

  try {
    const booking = await db.withTransaction(async (client) => {
      const result = await client.query(
        'CALL sp_create_booking($1, $2::jsonb, NULL, NULL)',
        [req.user.user_id, JSON.stringify(slots)]
      );

      return {
        booking_id: result.rows[0]?.p_booking_id,
        total_amount: result.rows[0]?.p_total_amount,
        status: 'pending',
      };
    });

    return res.status(201).json({
      ...booking,
      message: 'Booking created successfully. Settle payment to confirm reservation.',
    });
  } catch (err) {
    if (err.code === '23P01' || err.message?.includes('already reserved')) {
      return res.status(409).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
}

/**
 * GET /api/bookings/mine
 */
async function listMyBookings(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT
        b.booking_id,
        b.status,
        b.total_amount,
        b.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'field_id', bs.field_id,
              'field_name', f.name,
              'turf_id', t.turf_id,
              'turf_name', t.name,
              'slot_date', TO_CHAR(bs.slot_date, 'YYYY-MM-DD'),
              'start_time', bs.start_time,
              'hourly_rate', fn_get_hourly_rate(bs.field_id, bs.slot_date, bs.start_time)
            ) ORDER BY bs.slot_date, bs.start_time
          ) FILTER (WHERE bs.field_id IS NOT NULL), '[]'
        ) AS slots,
        (
          SELECT json_agg(
            json_build_object(
              'payment_id', p.payment_id,
              'amount', p.amount,
              'status', p.status,
              'created_at', p.created_at
            )
          ) FROM payments p WHERE p.booking_id = b.booking_id
        ) AS payments
      FROM bookings b
      LEFT JOIN booking_slots bs ON b.booking_id = bs.booking_id
      LEFT JOIN fields f ON bs.field_id = f.field_id
      LEFT JOIN turfs t ON f.turf_id = t.turf_id
      WHERE b.customer_id = $1
      GROUP BY b.booking_id
      ORDER BY b.created_at DESC`,
      [req.user.user_id]
    );

    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/bookings/for-my-turfs
 */
async function listBookingsForMyTurfs(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT
        b.booking_id,
        b.status,
        b.total_amount,
        b.created_at,
        u.name AS customer_name,
        u.email AS customer_email,
        u.phone AS customer_phone,
        t.name AS turf_name,
        f.name AS field_name,
        TO_CHAR(bs.slot_date, 'YYYY-MM-DD') AS slot_date,
        bs.start_time
      FROM bookings b
      JOIN users u ON b.customer_id = u.user_id
      JOIN booking_slots bs ON b.booking_id = bs.booking_id
      JOIN fields f ON bs.field_id = f.field_id
      JOIN turfs t ON f.turf_id = t.turf_id
      WHERE t.organizer_id = $1
      ORDER BY bs.slot_date DESC, bs.start_time DESC`,
      [req.user.user_id]
    );

    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/bookings/:id/cancel
 * DML 21: Uses withTransaction
 */
async function cancelBooking(req, res) {
  const { id } = req.params;
  const { cancel_reason } = req.body;

  try {
    await db.withTransaction(async (client) => {
      const { rows } = await client.query(
        `SELECT customer_id, status FROM bookings WHERE booking_id = $1 FOR UPDATE`,
        [id]
      );

      if (!rows.length) throw new Error('Booking not found.');
      const booking = rows[0];

      if (booking.customer_id !== req.user.user_id && !req.user.roles?.includes('organizer')) {
        throw new Error('Unauthorized to cancel this booking.');
      }
      if (booking.status === 'cancelled') throw new Error('Booking is already cancelled.');
      if (booking.status === 'completed') throw new Error('Cannot cancel a completed booking.');

      await client.query(
        `UPDATE bookings SET status = 'cancelled', cancel_reason = $1 WHERE booking_id = $2`,
        [cancel_reason || 'Cancelled by user', id]
      );
    });

    return res.json({ message: 'Booking cancelled successfully. Slot freed for other players.' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * PATCH /api/bookings/:id/confirm
 * DML 22: Uses withTransaction
 */
async function confirmBooking(req, res) {
  const { id } = req.params;

  try {
    await db.withTransaction(async (client) => {
      const { rows } = await client.query(
        `SELECT b.booking_id, t.organizer_id
         FROM bookings b
         JOIN booking_slots bs ON b.booking_id = bs.booking_id
         JOIN fields f ON bs.field_id = f.field_id
         JOIN turfs t ON f.turf_id = t.turf_id
         WHERE b.booking_id = $1 FOR UPDATE`,
        [id]
      );

      if (!rows.length) throw new Error('Booking not found.');
      if (rows[0].organizer_id !== req.user.user_id) throw new Error('Unauthorized: Organizer access required.');

      await client.query(`UPDATE bookings SET status = 'confirmed' WHERE booking_id = $1`, [id]);
    });

    return res.json({ message: 'Booking confirmed.' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * POST /api/bookings/:id/review
 * DML 23: Uses withTransaction
 */
async function addTurfReview(req, res) {
  const { id } = req.params;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
  }

  try {
    const review = await db.withTransaction(async (client) => {
      const { rows } = await client.query(
        `SELECT customer_id, status FROM bookings WHERE booking_id = $1 FOR UPDATE`,
        [id]
      );

      if (!rows.length) throw new Error('Booking not found.');
      if (rows[0].customer_id !== req.user.user_id) throw new Error('Only the player who booked this pitch can submit a review.');
      if (rows[0].status === 'cancelled') throw new Error('Cannot review a cancelled booking.');

      const insertResult = await client.query(
        `INSERT INTO turf_reviews (booking_id, rating, comment, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (booking_id) DO UPDATE SET rating = $2, comment = $3
         RETURNING *`,
        [id, rating, comment]
      );
      return insertResult.rows[0];
    });

    return res.status(201).json(review);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

module.exports = {
  createBooking,
  listMyBookings,
  listBookingsForMyTurfs,
  cancelBooking,
  confirmBooking,
  addTurfReview,
};