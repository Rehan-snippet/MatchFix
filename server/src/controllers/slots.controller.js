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
 * GET /api/slots/schedule?turf_id=X&date=YYYY-MM-DD
 * Organizer view of the entire pitch timetable for a specific date
 */
async function getTurfSchedule(req, res) {
  const { turf_id, date } = req.query;

  if (!turf_id || !date) {
    return res.status(400).json({ error: 'turf_id and date query parameters are required.' });
  }

  try {
    // Check authorization: organizer must own turf or be admin
    const turfCheck = await db.query(
      `SELECT turf_id, name, organizer_id FROM turfs WHERE turf_id = $1`,
      [turf_id]
    );

    if (!turfCheck.rows.length) {
      return res.status(404).json({ error: 'Turf venue not found.' });
    }

    const turf = turfCheck.rows[0];
    if (!req.user.is_admin && turf.organizer_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Unauthorized to view schedule for this venue.' });
    }

    // Get all fields for this turf
    const fieldsRes = await db.query(
      `SELECT field_id, name AS field_name, side_type, surface
       FROM fields
       WHERE turf_id = $1
       ORDER BY field_id ASC`,
      [turf_id]
    );

    // Get all slots with bookings for this turf and date
    const slotsRes = await db.query(
      `SELECT 
        s.field_id,
        TO_CHAR(s.slot_date, 'YYYY-MM-DD') AS slot_date,
        s.start_time,
        s.end_time,
        fn_get_hourly_rate(s.field_id, s.slot_date, s.start_time) AS hourly_rate,
        b.booking_id,
        b.status AS booking_status,
        b.payment_method,
        b.advance_amount,
        b.cash_balance,
        b.total_amount,
        b.created_at AS booked_at,
        u.name AS customer_name,
        u.phone AS customer_phone,
        u.email AS customer_email
      FROM fields f
      JOIN slots s ON f.field_id = s.field_id
      LEFT JOIN booking_slots bs 
        ON bs.field_id = s.field_id 
       AND bs.slot_date = s.slot_date 
       AND bs.start_time = s.start_time
      LEFT JOIN bookings b 
        ON bs.booking_id = b.booking_id 
       AND b.status <> 'cancelled'
      LEFT JOIN users u 
        ON b.customer_id = u.user_id
      WHERE f.turf_id = $1
        AND s.slot_date = $2::DATE
      ORDER BY s.field_id ASC, s.start_time ASC`,
      [turf_id, date]
    );

    // Group slots by field_id
    const slotsByField = {};
    for (const slot of slotsRes.rows) {
      if (!slotsByField[slot.field_id]) {
        slotsByField[slot.field_id] = [];
      }
      slotsByField[slot.field_id].push({
        slot_date: slot.slot_date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        hourly_rate: Number(slot.hourly_rate || 0),
        is_reserved: Boolean(slot.booking_id),
        booking: slot.booking_id
          ? {
              booking_id: slot.booking_id,
              status: slot.booking_status,
              payment_method: slot.payment_method,
              advance_amount: Number(slot.advance_amount || 0),
              cash_balance: Number(slot.cash_balance || 0),
              total_amount: Number(slot.total_amount || 0),
              booked_at: slot.booked_at,
              customer_name: slot.customer_name,
              customer_phone: slot.customer_phone,
              customer_email: slot.customer_email,
            }
          : null,
      });
    }

    const fieldsWithSlots = fieldsRes.rows.map((f) => ({
      ...f,
      slots: slotsByField[f.field_id] || [],
    }));

    return res.json({
      turf_id: turf.turf_id,
      turf_name: turf.name,
      date,
      fields: fieldsWithSlots,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/slots/generate
 * DML 19: Standardized to withTransaction
 * Generates slots for either a specific field or all fields in a turf over a date range
 */
async function generateSlots(req, res) {
  const { field_id, turf_id, start_date, end_date, start_hour = 8, end_hour = 22 } = req.body;

  if ((!field_id && !turf_id) || !start_date || !end_date) {
    return res.status(400).json({ error: 'field_id or turf_id, along with start_date and end_date are required.' });
  }

  const sHour = Math.max(0, Math.min(23, Number(start_hour) || 8));
  const eHour = Math.max(sHour, Math.min(23, Number(end_hour) || 22));

  try {
    await db.withTransaction(async (client) => {
      let fieldIds = [];

      if (turf_id) {
        const turfCheck = await client.query(
          `SELECT organizer_id FROM turfs WHERE turf_id = $1`,
          [turf_id]
        );
        if (!turfCheck.rows.length) throw new Error('Turf venue not found.');
        if (!req.user.is_admin && turfCheck.rows[0].organizer_id !== req.user.user_id) {
          throw new Error('Unauthorized.');
        }

        const fields = await client.query(
          `SELECT field_id FROM fields WHERE turf_id = $1`,
          [turf_id]
        );
        fieldIds = fields.rows.map((r) => r.field_id);
        if (!fieldIds.length) throw new Error('No pitches found under this turf venue.');
      } else {
        const check = await client.query(
          `SELECT t.organizer_id FROM fields f JOIN turfs t ON f.turf_id = t.turf_id WHERE f.field_id = $1`,
          [field_id]
        );
        if (!check.rows.length) throw new Error('Field not found.');
        if (!req.user.is_admin && check.rows[0].organizer_id !== req.user.user_id) {
          throw new Error('Unauthorized.');
        }
        fieldIds = [Number(field_id)];
      }

      for (const fid of fieldIds) {
        await client.query(
          `INSERT INTO slots (field_id, slot_date, start_time, end_time)
           SELECT
             $1::INT,
             d::DATE,
             (h || ':00:00')::TIME,
             ((h + 1) || ':00:00')::TIME
           FROM generate_series($2::DATE, $3::DATE, '1 day'::INTERVAL) d
           CROSS JOIN generate_series($4::INT, $5::INT) h
           ON CONFLICT (field_id, slot_date, start_time) DO NOTHING`,
          [fid, start_date, end_date, sHour, eHour]
        );
      }
    });

    return res.json({ message: 'Pitch slots generated successfully.' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * POST /api/slots/toggle
 * Toggle slot availability: 'block' (mark maintenance/delete slot) or 'unblock' (open slot)
 */
async function toggleSlot(req, res) {
  const { field_id, slot_date, start_time, end_time, action } = req.body;

  if (!field_id || !slot_date || !start_time || !action) {
    return res.status(400).json({ error: 'field_id, slot_date, start_time, and action are required.' });
  }

  try {
    const check = await db.query(
      `SELECT t.organizer_id FROM fields f JOIN turfs t ON f.turf_id = t.turf_id WHERE f.field_id = $1`,
      [field_id]
    );
    if (!check.rows.length) return res.status(404).json({ error: 'Field not found.' });
    if (!req.user.is_admin && check.rows[0].organizer_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    if (action === 'block') {
      const resCheck = await db.query(
        `SELECT 1 FROM booking_slots bs
         JOIN bookings b ON bs.booking_id = b.booking_id
         WHERE bs.field_id = $1 AND bs.slot_date = $2::DATE AND bs.start_time = $3::TIME AND b.status <> 'cancelled'`,
        [field_id, slot_date, start_time]
      );
      if (resCheck.rows.length) {
        return res.status(400).json({
          error: 'Cannot block slot: an active customer reservation exists for this time slot.',
        });
      }

      await db.query(
        `DELETE FROM slots WHERE field_id = $1 AND slot_date = $2::DATE AND start_time = $3::TIME`,
        [field_id, slot_date, start_time]
      );

      return res.json({ message: 'Slot blocked / marked unavailable.' });
    } else if (action === 'unblock') {
      let endTime = end_time;
      if (!endTime) {
        const [h, m] = start_time.split(':');
        const nextH = (parseInt(h, 10) + 1).toString().padStart(2, '0');
        endTime = `${nextH}:${m || '00'}:00`;
      }

      await db.query(
        `INSERT INTO slots (field_id, slot_date, start_time, end_time)
         VALUES ($1, $2::DATE, $3::TIME, $4::TIME)
         ON CONFLICT (field_id, slot_date, start_time) DO NOTHING`,
        [field_id, slot_date, start_time, endTime]
      );

      return res.json({ message: 'Slot opened for booking.' });
    } else {
      return res.status(400).json({ error: "Invalid action. Must be 'block' or 'unblock'." });
    }
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

module.exports = {
  listSlots,
  getTurfSchedule,
  generateSlots,
  toggleSlot,
};