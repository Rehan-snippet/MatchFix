const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// Finds the hourly rate that applies to a given field/day-of-week/start_time
// by matching against pricing_rules (day_of_week + time window).
async function findRate(client, fieldId, dateStr, startTime) {
  const dow = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
  const { rows } = await client.query(
    `SELECT hourly_rate FROM pricing_rules
     WHERE field_id = $1 AND day_of_week = $2
       AND start_time <= $3::time AND end_time > $3::time
       AND effective_from <= $4::date
     ORDER BY effective_from DESC LIMIT 1`,
    [fieldId, dow, startTime, dateStr]
  );
  return rows[0] ? Number(rows[0].hourly_rate) : null;
}

// POST /api/bookings  (customer)
// body: { slots: [{ field_id, slot_date, start_time, end_time }, ...] }
// "reserves": every Booking must reserve at least one Slot (enforced here).
// "books": Booking always belongs to exactly one Customer (req.user).
const createBooking = asyncHandler(async (req, res) => {
  const { slots } = req.body;
  if (!Array.isArray(slots) || slots.length === 0) {
    throw new ApiError(400, 'slots must be a non-empty array of { field_id, slot_date, start_time, end_time }');
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    let total = 0;
    for (const s of slots) {
      if (!s.field_id || !s.slot_date || !s.start_time || !s.end_time) {
        throw new ApiError(400, 'Each slot needs field_id, slot_date, start_time, end_time');
      }
      // Make sure the slot exists (create it on the fly if the organizer
      // pre-defined the field but not this exact slot — keeps the demo flow
      // simple; in production you'd require slots to pre-exist).
      await client.query(
        `INSERT INTO slots (field_id, slot_date, start_time, end_time)
         VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
        [s.field_id, s.slot_date, s.start_time, s.end_time]
      );
      const rate = await findRate(client, s.field_id, s.slot_date, s.start_time);
      total += rate ?? 0;
    }

    const bookingRes = await client.query(
      `INSERT INTO bookings (customer_id, status, total_amount) VALUES ($1,'pending',$2) RETURNING *`,
      [req.user.user_id, total]
    );
    const booking = bookingRes.rows[0];

    for (const s of slots) {
      // The unique index one_active_booking_per_slot will throw a 23505
      // (translated to a friendly 400 by errorHandler.js) if the slot is
      // already taken — this is what stops double-booking.
      await client.query(
        `INSERT INTO booking_slots (booking_id, field_id, slot_date, start_time)
         VALUES ($1,$2,$3,$4)`,
        [booking.booking_id, s.field_id, s.slot_date, s.start_time]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(booking);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// GET /api/bookings/mine  (customer)
const listMyBookings = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT b.*,
            COALESCE(json_agg(json_build_object(
              'field_id', bs.field_id, 'slot_date', bs.slot_date, 'start_time', bs.start_time,
              'field_name', f.name, 'turf_name', t.name, 'turf_id', t.turf_id
            ) ORDER BY bs.slot_date, bs.start_time) FILTER (WHERE bs.booking_id IS NOT NULL), '[]') AS slots
     FROM bookings b
     LEFT JOIN booking_slots bs ON bs.booking_id = b.booking_id
     LEFT JOIN fields f ON f.field_id = bs.field_id
     LEFT JOIN turfs t ON t.turf_id = f.turf_id
     WHERE b.customer_id = $1
     GROUP BY b.booking_id
     ORDER BY b.created_at DESC`,
    [req.user.user_id]
  );
  res.json(rows);
});

// GET /api/bookings/for-my-turfs  (organizer) — bookings on turfs they own
const listBookingsForMyTurfs = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT DISTINCT b.*, u.name AS customer_name
     FROM bookings b
     JOIN booking_slots bs ON bs.booking_id = b.booking_id
     JOIN fields f ON f.field_id = bs.field_id
     JOIN turfs t ON t.turf_id = f.turf_id
     JOIN customers c ON c.user_id = b.customer_id
     JOIN users u ON u.user_id = c.user_id
     WHERE t.organizer_id = $1
     ORDER BY b.created_at DESC`,
    [req.user.user_id]
  );
  res.json(rows);
});

// PATCH /api/bookings/:id/cancel  (owning customer) { cancel_reason }
const cancelBooking = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM bookings WHERE booking_id = $1', [req.params.id]);
  if (!rows[0]) throw new ApiError(404, 'Booking not found');
  if (rows[0].customer_id !== req.user.user_id) throw new ApiError(403, 'Not your booking');

  const { rows: updated } = await db.query(
    `UPDATE bookings SET status = 'cancelled', cancelled_at = now(), cancel_reason = $1
     WHERE booking_id = $2 RETURNING *`,
    [req.body.cancel_reason || null, req.params.id]
  );
  res.json(updated[0]);
});

// PATCH /api/bookings/:id/confirm  (organizer of the turf involved)
const confirmBooking = asyncHandler(async (req, res) => {
  const check = await db.query(
    `SELECT DISTINCT t.organizer_id FROM booking_slots bs
     JOIN fields f ON f.field_id = bs.field_id
     JOIN turfs t ON t.turf_id = f.turf_id
     WHERE bs.booking_id = $1`,
    [req.params.id]
  );
  if (!check.rows.length) throw new ApiError(404, 'Booking not found');
  if (!check.rows.some((r) => r.organizer_id === req.user.user_id)) {
    throw new ApiError(403, 'You do not organize this turf');
  }
  const { rows } = await db.query(
    `UPDATE bookings SET status = 'confirmed' WHERE booking_id = $1 RETURNING *`,
    [req.params.id]
  );
  res.json(rows[0]);
});

// POST /api/bookings/:id/review  (owning customer) { rating, comment } -- "rates"
const rateBooking = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) throw new ApiError(400, 'rating must be between 1 and 5');

  const { rows: bookingRows } = await db.query('SELECT * FROM bookings WHERE booking_id = $1', [req.params.id]);
  if (!bookingRows[0]) throw new ApiError(404, 'Booking not found');
  if (bookingRows[0].customer_id !== req.user.user_id) throw new ApiError(403, 'Not your booking');

  const { rows } = await db.query(
    `INSERT INTO turf_reviews (booking_id, rating, comment) VALUES ($1,$2,$3) RETURNING *`,
    [req.params.id, rating, comment || null]
  );
  res.status(201).json(rows[0]);
});

module.exports = {
  createBooking,
  listMyBookings,
  listBookingsForMyTurfs,
  cancelBooking,
  confirmBooking,
  rateBooking,
};
