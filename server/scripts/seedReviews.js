require('dotenv').config();
const db = require('../src/config/db');

async function seedTurfReviews() {
  console.log('Seeding sample reviews for turfs...');

  const samples = [
    {
      turf_id: 1, // Greenline Turf Arena
      field_id: 1,
      customer_id: 5, // Rafi Chowdhury
      rating: 5,
      comment: 'Top quality 5-a-side pitch in Dhanmondi. Floodlights and locker rooms were great!',
      days_ago: 3,
      start: '18:00',
      end: '19:00'
    },
    {
      turf_id: 1, // Greenline Turf Arena
      field_id: 1,
      customer_id: 1, // Naeemul Haque
      rating: 4,
      comment: 'Good artificial grass and easy parking. Will definitely book again for weekend matches.',
      days_ago: 5,
      start: '20:00',
      end: '21:00'
    },
    {
      turf_id: 2, // Bashundhara Sports Hub
      field_id: 3,
      customer_id: 5,
      rating: 5,
      comment: 'Massive full-size pitch with lush grass. Perfect for 11v11 weekend tournaments.',
      days_ago: 4,
      start: '17:00',
      end: '18:00'
    },
    {
      turf_id: 4, // Kickoff Arena Banani
      field_id: 5,
      customer_id: 1,
      rating: 5,
      comment: 'Awesome rooftop atmosphere! German turf feels soft on the knees and the lights are stellar.',
      days_ago: 6,
      start: '19:00',
      end: '20:00'
    },
    {
      turf_id: 5, // Mirpur Football Park
      field_id: 6,
      customer_id: 5,
      rating: 5,
      comment: 'Very affordable and well-maintained ground. Ball rental was super convenient.',
      days_ago: 7,
      start: '16:00',
      end: '17:00'
    },
  ];

  for (const s of samples) {
    // 1. Create a confirmed booking in the past
    const bRes = await db.query(
      `INSERT INTO bookings (customer_id, total_amount, status, created_at)
       VALUES ($1, 1500.00, 'confirmed', NOW() - ($2 || ' days')::INTERVAL)
       RETURNING booking_id`,
      [s.customer_id, s.days_ago]
    );
    const bookingId = bRes.rows[0].booking_id;

    // 2. Insert slot & booking_slot
    await db.query(
      `INSERT INTO slots (field_id, slot_date, start_time, end_time)
       VALUES ($1, CURRENT_DATE - ($2 || ' days')::INTERVAL, $3, $4)
       ON CONFLICT (field_id, slot_date, start_time) DO NOTHING`,
      [s.field_id, s.days_ago, s.start, s.end]
    );

    await db.query(
      `INSERT INTO booking_slots (booking_id, field_id, slot_date, start_time)
       VALUES ($1, $2, CURRENT_DATE - ($3 || ' days')::INTERVAL, $4)
       ON CONFLICT DO NOTHING`,
      [bookingId, s.field_id, s.days_ago, s.start]
    );

    // 3. Insert review
    await db.query(
      `INSERT INTO turf_reviews (booking_id, rating, comment, created_at)
       VALUES ($1, $2, $3, NOW() - (($4 - 1) || ' days')::INTERVAL)
       ON CONFLICT (booking_id) DO NOTHING`,
      [bookingId, s.rating, s.comment, s.days_ago]
    );
  }

  console.log('Sample turf reviews seeded successfully.');
  process.exit(0);
}

seedTurfReviews().catch((err) => {
  console.error('Error seeding reviews:', err);
  process.exit(1);
});
