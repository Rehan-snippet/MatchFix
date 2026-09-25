const db = require('../config/db');

/**
 * GET /api/slots?field_id=X&date=YYYY-MM-DD
 */
async function listSlots(req, res) {
  const { field_id, date } = req.query;

  if (!field_id || !date) {
    return res.status(400).json({ error: 'field_id and date parameters are required.' });
  }

  try {
    const { rows } = await db.query(
      `SELECT
        s.field_id,
        TO_CHAR(s.slot_date, 'YYYY-MM-DD') AS slot_date,
        s.start_time,
        s.end_time,
        fn_get_hourly_rate(s.field_id, s.slot_date, s.start_time) AS hourly_rate,
        EXISTS (
          SELECT 1
          FROM booking_slots bs
          JOIN bookings b ON bs.booking_id = b.booking_id
          WHERE bs.field_id = s.field_id
            AND bs.slot_date = s.slot_date
            AND bs.start_time = s.start_time
            AND b.status <> 'cancelled'
        ) AS is_reserved
      FROM slots s
      WHERE s.field_id = $1
        AND s.slot_date = $2
      ORDER BY s.start_time ASC`,
      [field_id, date]
    );

    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/slots/generate
 * DML 19: Standardized to withTransaction
 */
async function generateSlots(req, res) {
  const { field_id, start_date, end_date } = req.body;

  if (!field_id || !start_date || !end_date) {
    return res.status(400).json({ error: 'field_id, start_date, and end_date are required.' });
  }

  try {
    await db.withTransaction(async (client) => {
      // Check organizer authorization
      const check = await client.query(
        `SELECT t.organizer_id FROM fields f JOIN turfs t ON f.turf_id = t.turf_id WHERE f.field_id = $1`,
        [field_id]
      );
      if (!check.rows.length) throw new Error('Field not found.');
      if (check.rows[0].organizer_id !== req.user.user_id) throw new Error('Unauthorized.');

      await client.query(
        `INSERT INTO slots (field_id, slot_date, start_time, end_time)
         SELECT
           $1::INT,
           d::DATE,
           (h || ':00:00')::TIME,
           ((h + 1) || ':00:00')::TIME
         FROM generate_series($2::DATE, $3::DATE, '1 day'::INTERVAL) d
         CROSS JOIN generate_series(8, 22) h
         ON CONFLICT (field_id, slot_date, start_time) DO NOTHING`,
        [field_id, start_date, end_date]
      );
    });

    return res.json({ message: 'Pitch slots generated successfully.' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

module.exports = {
  listSlots,
  generateSlots,
};