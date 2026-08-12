const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { assertOwnsField } = require('./fields.controller');

// GET /api/slots?field_id=1&date=2026-08-20
// Returns slots plus whether each one is currently reserved by an active
// booking (so the client can grey out taken slots).
const listSlots = asyncHandler(async (req, res) => {
  const { field_id, date } = req.query;
  if (!field_id) throw new ApiError(400, 'field_id query param is required');

  const conditions = ['s.field_id = $1'];
  const params = [field_id];
  if (date) {
    params.push(date);
    conditions.push(`s.slot_date = $${params.length}`);
  }

  const { rows } = await db.query(
    `SELECT s.*,
            EXISTS (
              SELECT 1 FROM booking_slots bs
              JOIN bookings b ON b.booking_id = bs.booking_id
              WHERE bs.field_id = s.field_id AND bs.slot_date = s.slot_date
                AND bs.start_time = s.start_time AND b.status <> 'cancelled'
            ) AS is_reserved
     FROM slots s
     WHERE ${conditions.join(' AND ')}
     ORDER BY s.slot_date, s.start_time`,
    params
  );
  res.json(rows);
});

// POST /api/slots  (organizer)  { field_id, slot_date, start_time, end_time }
const createSlot = asyncHandler(async (req, res) => {
  const { field_id, slot_date, start_time, end_time } = req.body;
  if (!field_id || !slot_date || !start_time || !end_time) {
    throw new ApiError(400, 'field_id, slot_date, start_time and end_time are required');
  }
  await assertOwnsField(field_id, req.user.user_id);

  const { rows } = await db.query(
    `INSERT INTO slots (field_id, slot_date, start_time, end_time) VALUES ($1,$2,$3,$4) RETURNING *`,
    [field_id, slot_date, start_time, end_time]
  );
  res.status(201).json(rows[0]);
});

// POST /api/slots/generate  (organizer)
// Bulk-creates one-hour slots for a field across a date range, skipping any
// that already exist. Handy so organizers don't have to click "add slot"
// dozens of times.
const generateSlots = asyncHandler(async (req, res) => {
  const { field_id, start_date, end_date, start_hour = 6, end_hour = 23 } = req.body;
  if (!field_id || !start_date || !end_date) {
    throw new ApiError(400, 'field_id, start_date and end_date are required');
  }
  await assertOwnsField(field_id, req.user.user_id);

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    let created = 0;
    const cur = new Date(start_date);
    const end = new Date(end_date);
    while (cur <= end) {
      const dateStr = cur.toISOString().slice(0, 10);
      for (let h = start_hour; h < end_hour; h += 1) {
        const startTime = `${String(h).padStart(2, '0')}:00`;
        const endTime = `${String(h + 1).padStart(2, '0')}:00`;
        const { rowCount } = await client.query(
          `INSERT INTO slots (field_id, slot_date, start_time, end_time)
           VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
          [field_id, dateStr, startTime, endTime]
        );
        created += rowCount;
      }
      cur.setDate(cur.getDate() + 1);
    }
    await client.query('COMMIT');
    res.status(201).json({ created });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

module.exports = { listSlots, createSlot, generateSlots };
