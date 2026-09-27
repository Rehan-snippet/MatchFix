require('dotenv').config();
const db = require('../src/config/db');

async function seedUpcomingSlots() {
  console.log('Generating upcoming slots for all sample fields for the next 14 days...');
  
  const result = await db.query(`
    INSERT INTO slots (field_id, slot_date, start_time, end_time)
    SELECT
      f.field_id,
      d::DATE,
      (h || ':00:00')::TIME,
      ((h + 1) || ':00:00')::TIME
    FROM fields f
    CROSS JOIN generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', '1 day'::INTERVAL) d
    CROSS JOIN generate_series(8, 22) h
    WHERE f.field_id <= 11
    ON CONFLICT (field_id, slot_date, start_time) DO NOTHING;
  `);

  console.log(`Successfully generated upcoming slots. Rows affected: ${result.rowCount}`);
  process.exit(0);
}

seedUpcomingSlots().catch((err) => {
  console.error('Error generating slots:', err);
  process.exit(1);
});
