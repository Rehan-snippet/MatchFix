const fs = require('fs');

async function seedDhakaTurfs(query) {
  try {
    const { rows: areaRows } = await query('SELECT count(*) as count FROM areas');
    if (parseInt(areaRows[0].count, 10) < 6) {
      console.log('Seeding additional Dhaka areas...');
      await query(`
        INSERT INTO areas (name, city, center_lat, center_lng) VALUES
          ('Banani',      'Dhaka', 23.793700, 90.404300),
          ('Gulshan',     'Dhaka', 23.792500, 90.416700),
          ('Uttara',      'Dhaka', 23.875900, 90.379500),
          ('Mirpur',      'Dhaka', 23.807100, 90.368700),
          ('Mohammadpur', 'Dhaka', 23.765800, 90.358400),
          ('Badda',       'Dhaka', 23.780600, 90.426700),
          ('Kuril',       'Dhaka', 23.822300, 90.420800)
        ON CONFLICT DO NOTHING;
      `);
    }

    const { rows: turfCount } = await query('SELECT count(*) as count FROM turfs');
    if (parseInt(turfCount[0].count, 10) < 6) {
      console.log('Seeding rich Airbnb-style Dhaka turfs...');

      // Fetch area IDs
      const { rows: areas } = await query('SELECT area_id, name FROM areas');
      const areaMap = {};
      areas.forEach((a) => {
        areaMap[a.name] = a.area_id;
      });

      // Sample new turfs with accurate coordinates matching user's Airbnb map screenshot
      const extraTurfs = [
        {
          name: 'Kickoff Arena Banani',
          area: 'Banani',
          address: 'Road 11, Block D, Banani, Dhaka',
          lat: 23.7937,
          lng: 90.4043,
          description: 'Premier rooftop 5-a-side floodlit arena with German turf and player lounge.',
          price: 1800,
          side: '5v5',
          images: [
            'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1000&q=80',
          ],
        },
        {
          name: 'Mirpur Football Park',
          area: 'Mirpur',
          address: 'Section 11, Mirpur, Dhaka',
          lat: 23.8071,
          lng: 90.3687,
          description: 'FIFA-certified artificial turf, floodlights, changing rooms, and ball rental.',
          price: 950,
          side: '5v5',
          images: [
            'https://images.unsplash.com/photo-1529900248461-90567a644dd8?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=1000&q=80',
          ],
        },
        {
          name: 'Uttara Champions Pitch',
          area: 'Uttara',
          address: 'Sector 7, Road 18, Uttara, Dhaka',
          lat: 23.8759,
          lng: 90.3795,
          description: 'Twin 7v7 and 5v5 fields with covered seating, cafeteria, and secure parking.',
          price: 1400,
          side: '7v7',
          images: [
            'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1000&q=80',
          ],
        },
        {
          name: 'Hatirjheel Skyline Arena',
          area: 'Badda',
          address: 'Rampura Bridge End, Hatirjheel, Dhaka',
          lat: 23.7745,
          lng: 90.418,
          description: 'Scenic lakeside night football turf with high-powered LED floodlights.',
          price: 1650,
          side: '5v5',
          images: [
            'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=1000&q=80',
          ],
        },
        {
          name: 'Gulshan Premier Ground',
          area: 'Gulshan',
          address: 'Gulshan 2 Avenue, Dhaka',
          lat: 23.7925,
          lng: 90.4167,
          description: 'Luxury sports venue with 11v11 and 7v7 pitches, private locker rooms, and café.',
          price: 2800,
          side: '11v11',
          images: [
            'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1529900248461-90567a644dd8?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1000&q=80',
          ],
        },
        {
          name: 'Mohammadpur Kickerz Zone',
          area: 'Mohammadpur',
          address: 'Ring Road, Japan Garden City, Dhaka',
          lat: 23.7658,
          lng: 90.3584,
          description: 'High-density community football arena with 5-a-side pitch, bibs, and ref on demand.',
          price: 1100,
          side: '5v5',
          images: [
            'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1000&q=80',
          ],
        },
        {
          name: 'Kuril Express Turf',
          area: 'Kuril',
          address: 'Kuril Flyover East, Dhaka',
          lat: 23.8223,
          lng: 90.4208,
          description: 'Convenient transit-hub football pitch, available 24/7 with instant booking.',
          price: 1350,
          side: '7v7',
          images: [
            'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1000&q=80',
          ],
        },
      ];

      for (const t of extraTurfs) {
        const areaId = areaMap[t.area] || areas[0].area_id;
        const res = await query(
          `INSERT INTO turfs (area_id, organizer_id, name, address, latitude, longitude, description)
           VALUES ($1, 1, $2, $3, $4, $5, $6) RETURNING turf_id`,
          [areaId, t.name, t.address, t.lat, t.lng, t.description]
        );
        const turfId = res.rows[0].turf_id;

        // Insert images
        for (let i = 0; i < t.images.length; i++) {
          await query(
            `INSERT INTO turf_images (turf_id, url, is_cover) VALUES ($1, $2, $3)`,
            [turfId, t.images[i], i === 0]
          );
        }

        // Insert field
        const fRes = await query(
          `INSERT INTO fields (turf_id, name, side_type, surface)
           VALUES ($1, $2, $3, 'Artificial Turf') RETURNING field_id`,
          [turfId, `Main Pitch (${t.side})`, t.side]
        );
        const fieldId = fRes.rows[0].field_id;

        // Pricing rules (Sunday to Saturday)
        for (let d = 0; d < 7; d++) {
          await query(
            `INSERT INTO pricing_rules (field_id, day_of_week, start_time, end_time, hourly_rate)
             VALUES ($1, $2, '06:00', '23:00', $3)`,
            [fieldId, d, t.price]
          );
        }

        // Slots for today and the next 4 days
        for (let dayOffset = 0; dayOffset <= 4; dayOffset++) {
          const slotTimes = [
            ['16:00', '17:00'],
            ['17:00', '18:00'],
            ['18:00', '19:00'],
            ['19:00', '20:00'],
            ['20:00', '21:00'],
            ['21:00', '22:00'],
          ];
          for (const [st, et] of slotTimes) {
            await query(
              `INSERT INTO slots (field_id, slot_date, start_time, end_time)
               VALUES ($1, CURRENT_DATE + ${dayOffset}, $2, $3)
               ON CONFLICT DO NOTHING`,
              [fieldId, st, et]
            );
          }
        }
      }

      console.log('Dhaka turfs seeded successfully with photos, coordinates, and slots.');
    }
  } catch (err) {
    console.error('Failed to seed Dhaka turfs:', err.message);
  }
}

module.exports = seedDhakaTurfs;
