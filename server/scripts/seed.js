const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const fs = require('fs');
const bcrypt = require('bcryptjs');
const db = require('../src/config/db');

/**
 * MatchFix Master Unified Seed Script
 *
 * Populates a complete, rich, Bangladeshi-contextualized database from scratch:
 * - 2 Admins
 * - 6 Organizers (5 approved, 1 pending)
 * - 4 Sellers (3 approved, 1 pending)
 * - 5 Customers (with real Dhaka addresses & BD phones)
 * - 10 Dhaka Coverage Zones / Areas with real coordinates
 * - 9 Football Turfs (8 approved & active across Dhaka, 1 pending) with high-res photos
 * - 14 Pitches/Fields with side types (5v5, 7v7, 11v11) & surfaces
 * - Peak Weekend Pricing Rules
 * - 17-Day Hourly Pitch Slots Grid (08:00 - 23:00)
 * - 20 Football Products across all 6 categories (Boots, Jerseys, Balls, Equipment, Accessories, Goalkeeper)
 * - Live Customer Wishlist items
 * - Bookings & Turf Reviews (past completed with 5-star/4-star feedback, upcoming confirmed)
 * - Orders & Product Reviews (delivered with reviews, COD 20% advance-paid, shipped)
 * - Payments Ledger (bKash, Nagad, Card, Sandbox)
 * - Platform Configuration & Broadcast Announcements
 * - Admin Security Audit Trail Logs
 *
 * Universal Password for all seeded users: Passw0rd!
 */

async function main() {
  console.log('======================================================================');
  console.log('🌱 MATCHFIX MASTER DATABASE SEEDER (BANGLADESH CONTEXT)');
  console.log('======================================================================\n');

  const client = await db.getClient();

  try {
    // -------------------------------------------------------------------------
    // 1. Ensure Full Schema is Applied
    // -------------------------------------------------------------------------
    console.log('🔨 Ensuring database schema is fully up-to-date from schema.sql...');
    const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schemaSql);
      console.log('✅ Base schema verified.');
    }

    // -------------------------------------------------------------------------
    // 2. Wipe All Existing Data (Clean Slate with Sequence Reset)
    // -------------------------------------------------------------------------
    console.log('🧹 Purging all existing tables & resetting identity sequences...');
    await client.query(`
      TRUNCATE TABLE 
        payment_intents,
        admin_audit_logs,
        product_wishlist,
        password_resets,
        payments,
        product_reviews,
        order_items,
        orders,
        product_images,
        products,
        turf_reviews,
        booking_slots,
        bookings,
        slots,
        price_history,
        pricing_rules,
        fields,
        turf_images,
        turfs,
        areas,
        customers,
        sellers,
        organizers,
        users
      RESTART IDENTITY CASCADE;
    `);
    console.log('✅ Database is completely clean.\n');

    // Universal password hash for Passw0rd!
    const passwordHash = await bcrypt.hash('Passw0rd!', 10);

    // -------------------------------------------------------------------------
    // 3. Platform Configuration & Broadcast Settings
    // -------------------------------------------------------------------------
    console.log('⚙️ Populating platform settings...');
    await client.query(`
      INSERT INTO platform_settings (setting_key, setting_value, description) VALUES
        ('commission_rate', '8', 'Platform commission percentage charged to organizers and sellers on gross transactions'),
        ('advance_percentage', '20', 'Mandatory advance payment percentage for Cash at Venue pitch reservations and Cash on Delivery orders'),
        ('broadcast_enabled', 'true', 'Global broadcast banner display across the web platform'),
        ('broadcast_message', '⚽ Welcome to MatchFix! Book top football arenas across Dhaka and shop authentic football gear.', 'Broadcast announcement message shown to platform users'),
        ('broadcast_type', 'success', 'Broadcast banner severity style: info, warning, success, alert'),
        ('maintenance_mode', 'false', 'Flag indicating scheduled platform maintenance mode'),
        ('support_phone', '+880 1711-000001', 'Official MatchFix support helpline phone number'),
        ('support_email', 'support@matchfix.dev', 'Official MatchFix support email address')
      ON CONFLICT (setting_key) DO UPDATE 
        SET setting_value = EXCLUDED.setting_value,
            description = EXCLUDED.description;
    `);

    // -------------------------------------------------------------------------
    // 4. Dhaka Coverage Zones / Areas
    // -------------------------------------------------------------------------
    console.log('📍 Seeding Dhaka coverage zones (areas)...');
    const areaInserts = [
      ['Dhanmondi', 'Dhaka', 23.7465, 90.3760],
      ['Banani', 'Dhaka', 23.7937, 90.4043],
      ['Gulshan', 'Dhaka', 23.7925, 90.4167],
      ['Bashundhara', 'Dhaka', 23.8160, 90.4340],
      ['Mirpur', 'Dhaka', 23.8071, 90.3687],
      ['Uttara', 'Dhaka', 23.8759, 90.3795],
      ['Mohammadpur', 'Dhaka', 23.7658, 90.3584],
      ['Badda', 'Dhaka', 23.7806, 90.4267],
      ['Kuril', 'Dhaka', 23.8223, 90.4208],
      ['Old Dhaka', 'Dhaka', 23.7188, 90.3882],
    ];

    const areaMap = {};
    for (const [name, city, lat, lng] of areaInserts) {
      const res = await client.query(
        `INSERT INTO areas (name, city, center_lat, center_lng)
         VALUES ($1, $2, $3, $4)
         RETURNING area_id`,
        [name, city, lat, lng]
      );
      areaMap[name] = res.rows[0].area_id;
    }
    console.log(`✅ ${Object.keys(areaMap).length} Dhaka zones seeded.`);

    // -------------------------------------------------------------------------
    // 5. Users & Subclass Roles (Admins, Organizers, Sellers, Customers)
    // -------------------------------------------------------------------------
    console.log('👥 Seeding users & role permissions...');

    // 5.1 Admins
    const adminRes = await client.query(
      `INSERT INTO users (name, email, phone, password_hash, is_active, is_admin) VALUES
        ('Nahid Ahmed Rajon', 'admin@matchfix.dev', '01711000001', $1, TRUE, TRUE),
        ('Naeemul Haque', 'admin.haque@matchfix.dev', '01711000002', $1, TRUE, TRUE)
       RETURNING user_id, email`,
      [passwordHash]
    );
    const adminId1 = adminRes.rows[0].user_id;

    // 5.2 Organizers
    const organizerData = [
      ['Shakib Rahman', 'organizer.jaff@matchfix.dev', '01712000001', 'TL-DHK-2024-881', 'bKash: 01712000001', 'approved'],
      ['Tariqul Islam', 'organizer.kickoff@matchfix.dev', '01712000002', 'TL-DHK-2024-912', 'Nagad: 01712000002', 'approved'],
      ['Farhan Tanvir', 'organizer.greenline@matchfix.dev', '01712000003', 'TL-DHK-2024-403', 'bKash: 01712000003', 'approved'],
      ['Mahfuzur Rahman', 'organizer.mirpur@matchfix.dev', '01712000004', 'TL-DHK-2024-554', 'bKash: 01712000004', 'approved'],
      ['Arif Hossain', 'organizer.uttara@matchfix.dev', '01712000005', 'TL-DHK-2024-672', 'Nagad: 01712000005', 'approved'],
      ['Zubair Chowdhury', 'organizer.pending@matchfix.dev', '01712000006', 'TL-DHK-2025-019', 'bKash: 01712000006', 'pending'],
    ];

    const orgMap = {};
    for (const [name, email, phone, tradeLicence, payoutAccount, status] of organizerData) {
      const uRes = await client.query(
        `INSERT INTO users (name, email, phone, password_hash, is_active, is_admin)
         VALUES ($1, $2, $3, $4, TRUE, FALSE)
         RETURNING user_id`,
        [name, email, phone, passwordHash]
      );
      const uid = uRes.rows[0].user_id;
      await client.query(
        `INSERT INTO organizers (user_id, trade_licence, payout_account, approval_status)
         VALUES ($1, $2, $3, $4)`,
        [uid, tradeLicence, payoutAccount, status]
      );
      orgMap[email] = uid;
    }

    // 5.3 Sellers
    const sellerData = [
      ['Redwan Karim', 'seller.boots@matchfix.dev', '01813000001', 'Dhaka Boot Room', 'bKash: 01813000001', 'approved'],
      ['Sabbir Ahmed', 'seller.kits@matchfix.dev', '01813000002', 'Jersey Freak BD', 'Nagad: 01813000002', 'approved'],
      ['Asif Iqbal', 'seller.gear@matchfix.dev', '01813000003', 'Pro Kickers Gear', 'bKash: 01813000003', 'approved'],
      ['Kamrul Hasan', 'seller.pending@matchfix.dev', '01813000004', 'Old Dhaka Football Hub', 'Rocket: 01813000004', 'pending'],
    ];

    const sellerMap = {};
    for (const [name, email, phone, shopName, payoutAccount, status] of sellerData) {
      const uRes = await client.query(
        `INSERT INTO users (name, email, phone, password_hash, is_active, is_admin)
         VALUES ($1, $2, $3, $4, TRUE, FALSE)
         RETURNING user_id`,
        [name, email, phone, passwordHash]
      );
      const uid = uRes.rows[0].user_id;
      await client.query(
        `INSERT INTO sellers (user_id, shop_name, payout_account, approval_status)
         VALUES ($1, $2, $3, $4)`,
        [uid, shopName, payoutAccount, status]
      );
      sellerMap[email] = uid;
    }

    // 5.4 Customers
    const customerData = [
      ['Tanvir Ahmed', 'customer.tanvir@matchfix.dev', '01914000001', 'House 14, Road 27, Dhanmondi, Dhaka'],
      ['Rafi Chowdhury', 'customer.rafi@matchfix.dev', '01914000002', 'Flat 5B, Block D, Bashundhara R/A, Dhaka'],
      ['Mehedi Hasan', 'customer.mehedi@matchfix.dev', '01914000003', 'House 22, Road 11, Banani, Dhaka'],
      ['Anik Barua', 'customer.anik@matchfix.dev', '01914000004', 'Section 11, Block C, Mirpur, Dhaka'],
      ['Nabil Mahmud', 'customer.nabil@matchfix.dev', '01914000005', 'Sector 4, Road 18, Uttara, Dhaka'],
    ];

    const customerMap = {};
    for (const [name, email, phone, defaultAddress] of customerData) {
      const uRes = await client.query(
        `INSERT INTO users (name, email, phone, password_hash, is_active, is_admin)
         VALUES ($1, $2, $3, $4, TRUE, FALSE)
         RETURNING user_id`,
        [name, email, phone, passwordHash]
      );
      const uid = uRes.rows[0].user_id;
      await client.query(
        `INSERT INTO customers (user_id, default_address)
         VALUES ($1, $2)`,
        [uid, defaultAddress]
      );
      customerMap[email] = uid;
    }
    console.log('✅ Admins, Organizers, Sellers, and Customers seeded.');

    // -------------------------------------------------------------------------
    // 6. Turfs, Fields, Images & Pricing Rules
    // -------------------------------------------------------------------------
    console.log('⚽ Seeding football turfs, pitches & pricing rules across Dhaka...');

    const turfsData = [
      {
        name: 'Jaff Arena Bashundhara',
        organizer_email: 'organizer.jaff@matchfix.dev',
        area_name: 'Bashundhara',
        address: 'Block I, Road 8, Bashundhara R/A, Dhaka',
        lat: 23.8190,
        lng: 90.4385,
        hourly_rate: 1800.00,
        rating: 4.90,
        description: 'Premier floodlit arena with imported German artificial grass, player dugout, locker room & rooftop cafe.',
        status: 'approved',
        images: [
          { url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80', is_cover: true },
          { url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80', is_cover: false },
          { url: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1200&q=80', is_cover: false },
        ],
        fields: [
          { name: 'Pitch 1 (German Astro)', side_type: '5v5', surface: 'Artificial Turf' },
          { name: 'Pitch 2 (Championship)', side_type: '7v7', surface: 'Artificial Turf' },
        ],
        rules: [
          { day_of_week: 5, start_time: '17:00:00', end_time: '23:00:00', rate: 2200.00 }, // Friday peak
          { day_of_week: 6, start_time: '17:00:00', end_time: '23:00:00', rate: 2200.00 }, // Saturday peak
        ]
      },
      {
        name: 'Kickoff Arena Banani',
        organizer_email: 'organizer.kickoff@matchfix.dev',
        area_name: 'Banani',
        address: 'Road 11, Block D, Banani, Dhaka',
        lat: 23.7937,
        lng: 90.4043,
        hourly_rate: 1600.00,
        rating: 4.80,
        description: 'Vibrant rooftop 5-a-side floodlit football ground overlooking Banani lake. Sound system and bibs provided.',
        status: 'approved',
        images: [
          { url: 'https://images.unsplash.com/photo-1529900248461-90567a644dd8?auto=format&fit=crop&w=1200&q=80', is_cover: true },
          { url: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80', is_cover: false },
        ],
        fields: [
          { name: 'Rooftop Pitch Alpha', side_type: '5v5', surface: 'Artificial Turf' },
        ],
        rules: [
          { day_of_week: 5, start_time: '18:00:00', end_time: '23:00:00', rate: 2000.00 },
          { day_of_week: 6, start_time: '18:00:00', end_time: '23:00:00', rate: 2000.00 },
        ]
      },
      {
        name: 'Greenline Turf Arena',
        organizer_email: 'organizer.greenline@matchfix.dev',
        area_name: 'Dhanmondi',
        address: 'Road 27 (Old), Dhanmondi, Dhaka',
        lat: 23.7485,
        lng: 90.3730,
        hourly_rate: 1400.00,
        rating: 4.70,
        description: 'Centrally located Dhanmondi pitch with shock-absorbent infill, high-beam LED floodlights and shower facilities.',
        status: 'approved',
        images: [
          { url: 'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&w=1200&q=80', is_cover: true },
          { url: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80', is_cover: false },
        ],
        fields: [
          { name: 'Pitch Alpha', side_type: '5v5', surface: 'Artificial Turf' },
          { name: 'Pitch Beta', side_type: '5v5', surface: 'Artificial Turf' },
        ],
        rules: [
          { day_of_week: 5, start_time: '18:00:00', end_time: '22:00:00', rate: 1700.00 },
          { day_of_week: 6, start_time: '18:00:00', end_time: '22:00:00', rate: 1700.00 },
        ]
      },
      {
        name: 'Mirpur Football Park',
        organizer_email: 'organizer.mirpur@matchfix.dev',
        area_name: 'Mirpur',
        address: 'Section 11, Main Avenue, Mirpur, Dhaka',
        lat: 23.8071,
        lng: 90.3687,
        hourly_rate: 1100.00,
        rating: 4.60,
        description: 'Spacious multi-pitch facility with tournament-grade fencing, goal nets, free mineral water and ball rentals.',
        status: 'approved',
        images: [
          { url: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=1200&q=80', is_cover: true },
          { url: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=80', is_cover: false },
        ],
        fields: [
          { name: 'Main Ground (7v7)', side_type: '7v7', surface: 'Artificial Turf' },
          { name: 'Cage Pitch (5v5)', side_type: '5v5', surface: 'Artificial Turf' },
        ],
        rules: [
          { day_of_week: 5, start_time: '16:00:00', end_time: '22:00:00', rate: 1400.00 },
        ]
      },
      {
        name: 'Uttara Dribble Turf',
        organizer_email: 'organizer.uttara@matchfix.dev',
        area_name: 'Uttara',
        address: 'Sector 4, Road 18, Uttara, Dhaka',
        lat: 23.8680,
        lng: 90.3950,
        hourly_rate: 1300.00,
        rating: 4.75,
        description: 'Quiet residential neighborhood turf near Jashimuddin road. Ideal for corporate matches and weekend leagues.',
        status: 'approved',
        images: [
          { url: 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&w=1200&q=80', is_cover: true },
        ],
        fields: [
          { name: 'Dribble Pitch 1', side_type: '5v5', surface: 'Artificial Turf' },
        ],
        rules: []
      },
      {
        name: 'Goalz Arena Gulshan',
        organizer_email: 'organizer.kickoff@matchfix.dev',
        area_name: 'Gulshan',
        address: 'Gulshan 2 Avenue (Near Circle 2), Dhaka',
        lat: 23.7925,
        lng: 90.4167,
        hourly_rate: 2000.00,
        rating: 4.90,
        description: 'Elite rooftop football arena in the heart of Gulshan. High-lumen night illumination and air-conditioned lounge.',
        status: 'approved',
        images: [
          { url: 'https://images.unsplash.com/photo-1518604666864-74239527e7a3?auto=format&fit=crop&w=1200&q=80', is_cover: true },
        ],
        fields: [
          { name: 'Gulshan VIP Pitch', side_type: '5v5', surface: 'Artificial Turf' },
        ],
        rules: [
          { day_of_week: 5, start_time: '18:00:00', end_time: '23:00:00', rate: 2500.00 },
        ]
      },
      {
        name: 'Prime Turf Mohammadpur',
        organizer_email: 'organizer.greenline@matchfix.dev',
        area_name: 'Mohammadpur',
        address: 'Ring Road, Near Japan Garden City, Mohammadpur, Dhaka',
        lat: 23.7658,
        lng: 90.3584,
        hourly_rate: 1000.00,
        rating: 4.50,
        description: 'Fast-paced compact 5-a-side pitch with high rebound boards and friendly staff.',
        status: 'approved',
        images: [
          { url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80', is_cover: true },
        ],
        fields: [
          { name: 'Ring Road Arena', side_type: '5v5', surface: 'Artificial Turf' },
        ],
        rules: []
      },
      {
        name: 'SkyTurf Badda',
        organizer_email: 'organizer.jaff@matchfix.dev',
        area_name: 'Badda',
        address: 'Madani Avenue, 100 Feet Road, Badda, Dhaka',
        lat: 23.7820,
        lng: 90.4310,
        hourly_rate: 1500.00,
        rating: 4.80,
        description: 'Scenic open-air 7-a-side turf right by the 100 Feet canal road. Natural cross-breeze and spacious dugouts.',
        status: 'approved',
        images: [
          { url: 'https://images.unsplash.com/photo-1489944445391-11dd35574ca6?auto=format&fit=crop&w=1200&q=80', is_cover: true },
        ],
        fields: [
          { name: '100ft Pitch 1', side_type: '7v7', surface: 'Artificial Turf' },
        ],
        rules: []
      },
      {
        name: 'Old Town Astro Arena',
        organizer_email: 'organizer.pending@matchfix.dev',
        area_name: 'Old Dhaka',
        address: 'Near Lalbagh Fort, Lalbagh, Old Dhaka',
        lat: 23.7188,
        lng: 90.3882,
        hourly_rate: 1200.00,
        rating: 4.40,
        description: 'Historic Old Dhaka neighborhood turf venue awaiting administrative safety and commercial verification.',
        status: 'pending', // Demonstrates pending approvals in Admin Dashboard!
        images: [
          { url: 'https://images.unsplash.com/photo-1524015368236-bbf6f72545b6?auto=format&fit=crop&w=1200&q=80', is_cover: true },
        ],
        fields: [
          { name: 'Lalbagh Heritage Ground', side_type: '5v5', surface: 'Artificial Turf' },
        ],
        rules: []
      },
    ];

    const allFieldIds = [];
    const turfIdMap = {};

    for (const t of turfsData) {
      const orgId = orgMap[t.organizer_email];
      const areaId = areaMap[t.area_name];

      const tRes = await client.query(
        `INSERT INTO turfs (organizer_id, area_id, name, address, hourly_rate, latitude, longitude, rating, description, approval_status, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE)
         RETURNING turf_id`,
        [orgId, areaId, t.name, t.address, t.hourly_rate, t.lat, t.lng, t.rating, t.description, t.status]
      );
      const turfId = tRes.rows[0].turf_id;
      turfIdMap[t.name] = turfId;

      // Images
      for (const img of t.images) {
        await client.query(
          `INSERT INTO turf_images (turf_id, url, is_cover) VALUES ($1, $2, $3)`,
          [turfId, img.url, img.is_cover]
        );
      }

      // Fields
      for (const f of t.fields) {
        const fRes = await client.query(
          `INSERT INTO fields (turf_id, name, side_type, surface) VALUES ($1, $2, $3, $4)
           RETURNING field_id`,
          [turfId, f.name, f.side_type, f.surface]
        );
        const fieldId = fRes.rows[0].field_id;
        allFieldIds.push(fieldId);

        // Rules
        for (const r of t.rules) {
          await client.query(
            `INSERT INTO pricing_rules (field_id, day_of_week, start_time, end_time, hourly_rate)
             VALUES ($1, $2, $3, $4, $5)`,
            [fieldId, r.day_of_week, r.start_time, r.end_time, r.rate]
          );
        }
      }
    }
    console.log(`✅ ${turfsData.length} turfs and ${allFieldIds.length} fields seeded.`);

    // -------------------------------------------------------------------------
    // 7. Pitch Slots Grid (Past 3 Days + Next 14 Days)
    // -------------------------------------------------------------------------
    console.log('📅 Generating hourly pitch slots (08:00 to 23:00) across 17 days...');
    await client.query(`
      INSERT INTO slots (field_id, slot_date, start_time, end_time)
      SELECT
        f.field_id,
        d::DATE,
        (h || ':00:00')::TIME,
        ((h + 1) || ':00:00')::TIME
      FROM fields f
      CROSS JOIN generate_series(CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '14 days', '1 day'::INTERVAL) d
      CROSS JOIN generate_series(8, 22) h
      ON CONFLICT (field_id, slot_date, start_time) DO NOTHING;
    `);
    console.log('✅ Pitch slot schedule grid successfully generated.');

    // -------------------------------------------------------------------------
    // 8. Marketplace Products (Authentic Bangladesh Gear)
    // -------------------------------------------------------------------------
    console.log('🛍️ Seeding football products across all categories...');

    const productsData = [
      // Boots
      {
        seller: 'seller.boots@matchfix.dev',
        title: 'Nike Phantom GX Elite FG',
        category: 'Boots',
        price: 8500.00,
        condition: 'new',
        stock: 12,
        description: 'Top-tier firm-ground boots featuring Gripknit technology for elite ball control in wet and dry conditions.',
        status: 'approved',
        images: ['https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=800&q=80']
      },
      {
        seller: 'seller.boots@matchfix.dev',
        title: 'Adidas Predator Elite FG',
        category: 'Boots',
        price: 8200.00,
        condition: 'new',
        stock: 10,
        description: 'Iconic strike-zone boots with rubber Strikeskin fins and lightweight Controlframe 2.0 outsole.',
        status: 'approved',
        images: ['https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&w=800&q=80']
      },
      {
        seller: 'seller.boots@matchfix.dev',
        title: 'Puma Future Ultimate FG/AG',
        category: 'Boots',
        price: 7400.00,
        condition: 'new',
        stock: 8,
        description: 'Adaptive FUZIONFIT360 dual mesh upper with PWRTAPE support for dynamic agile playmakers.',
        status: 'approved',
        images: ['https://images.unsplash.com/photo-1552667466-07770ae110d0?auto=format&fit=crop&w=800&q=80']
      },
      {
        seller: 'seller.boots@matchfix.dev',
        title: 'Nike Mercurial Vapor 15 Pro',
        category: 'Boots',
        price: 4900.00,
        condition: 'used',
        stock: 4,
        description: 'Worn for 2 matches, like new condition, Size 42. Zoom Air unit embedded in plate for propulsive speed.',
        status: 'approved',
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80']
      },
      {
        seller: 'seller.boots@matchfix.dev',
        title: 'Mizuno Morelia Neo III Japan',
        category: 'Boots',
        price: 9500.00,
        condition: 'new',
        stock: 6,
        description: 'Handcrafted in Japan with ultra-supple premium Scotchguard K-Leather. Unrivaled barefoot touch.',
        status: 'approved',
        images: ['https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80']
      },
      {
        seller: 'seller.boots@matchfix.dev',
        title: 'Kipsta Agility 100 FG/AG Cleats',
        category: 'Boots',
        price: 2200.00,
        condition: 'new',
        stock: 15,
        description: 'Reliable entry-level studded boots with TPU sole for recreational players on artificial turf.',
        status: 'approved',
        images: ['https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?auto=format&fit=crop&w=800&q=80']
      },
      // Jerseys
      {
        seller: 'seller.kits@matchfix.dev',
        title: 'Bangladesh National Team 2026 Home Kit',
        category: 'Jerseys',
        price: 1450.00,
        condition: 'new',
        stock: 35,
        description: 'Official fan edition Bangladesh Football Federation red & green kit with sublimated Royal Bengal tiger motif.',
        status: 'approved',
        images: ['https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80']
      },
      {
        seller: 'seller.kits@matchfix.dev',
        title: 'Argentina 3-Star World Champions Home Jersey',
        category: 'Jerseys',
        price: 1650.00,
        condition: 'new',
        stock: 25,
        description: 'Official AFA 3-star world champions albiceleste striped jersey with gold FIFA World Champions crest.',
        status: 'approved',
        images: ['https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80']
      },
      {
        seller: 'seller.kits@matchfix.dev',
        title: 'Real Madrid 24/25 Home Jersey (UCL 15 Edition)',
        category: 'Jerseys',
        price: 1550.00,
        condition: 'new',
        stock: 20,
        description: 'Classic crisp white Real Madrid home kit with houndstooth pattern and star ball 15 badge on sleeve.',
        status: 'approved',
        images: ['https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=800&q=80']
      },
      {
        seller: 'seller.kits@matchfix.dev',
        title: 'FC Barcelona 24/25 125th Anniversary Home Kit',
        category: 'Jerseys',
        price: 1500.00,
        condition: 'new',
        stock: 20,
        description: 'Half-and-half blaugrana design honoring 125 years of FC Barcelona heritage. Breathable Dri-FIT mesh.',
        status: 'approved',
        images: ['https://images.unsplash.com/photo-1489944445391-11dd35574ca6?auto=format&fit=crop&w=800&q=80']
      },
      {
        seller: 'seller.kits@matchfix.dev',
        title: 'Arsenal 24/25 Cannon Home Kit',
        category: 'Jerseys',
        price: 1500.00,
        condition: 'new',
        stock: 18,
        description: 'Clean red and white Arsenal shirt featuring the standalone heritage Cannon crest and Aeroready technology.',
        status: 'approved',
        images: ['https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=800&q=80']
      },
      // Balls
      {
        seller: 'seller.gear@matchfix.dev',
        title: 'Nike Flight Match Ball (BFF Spec Size 5)',
        category: 'Balls',
        price: 4200.00,
        condition: 'new',
        stock: 10,
        description: 'Aerowsculpt molded grooves for 30% truer flight through the air. Thermal bonded seamless polyurethane.',
        status: 'approved',
        images: ['https://images.unsplash.com/photo-1614632537197-38a17061c2bd?auto=format&fit=crop&w=800&q=80']
      },
      {
        seller: 'seller.gear@matchfix.dev',
        title: 'Adidas UCL Pro Istanbul Match Ball',
        category: 'Balls',
        price: 4500.00,
        condition: 'new',
        stock: 8,
        description: 'Official FIFA Quality Pro certified ball featuring starry panels and textured surface for precise control.',
        status: 'approved',
        images: ['https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=800&q=80']
      },
      {
        seller: 'seller.gear@matchfix.dev',
        title: 'Kipsta Futsal Pro Low-Bounce Turf Ball',
        category: 'Balls',
        price: 1850.00,
        condition: 'new',
        stock: 14,
        description: 'Engineered specifically for 5-a-side rooftop turf matches. Controlled bounce and weighted bladder.',
        status: 'approved',
        images: ['https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=800&q=80']
      },
      // Equipment & Accessories
      {
        seller: 'seller.gear@matchfix.dev',
        title: 'G-Form Pro-S Elite Flexible Shin Guards',
        category: 'Equipment',
        price: 2400.00,
        condition: 'new',
        stock: 20,
        description: 'Smartflex technology pads that stay soft during play and instantly harden on tackle impact. Machine washable.',
        status: 'approved',
        images: ['https://images.unsplash.com/photo-1589487391730-58f20eb2c308?auto=format&fit=crop&w=800&q=80']
      },
      {
        seller: 'seller.gear@matchfix.dev',
        title: 'MatchFix Non-Slip Grip Socks (3-Pack Bundle)',
        category: 'Accessories',
        price: 750.00,
        condition: 'new',
        stock: 40,
        description: 'Silicone anti-skid rubber pads on base to lock feet inside boots and prevent blisters during sharp turns.',
        status: 'approved',
        images: ['https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=800&q=80']
      },
      {
        seller: 'seller.gear@matchfix.dev',
        title: 'Agility Training Speed Ladder & 10 Cone Set',
        category: 'Equipment',
        price: 1200.00,
        condition: 'new',
        stock: 12,
        description: '6-meter adjustable rung coordination ladder with carry bag and 10 high-visibility marker cones.',
        status: 'approved',
        images: ['https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80']
      },
      {
        seller: 'seller.gear@matchfix.dev',
        title: 'Team Training Practice Bibs (Set of 10 Neon)',
        category: 'Equipment',
        price: 1100.00,
        condition: 'new',
        stock: 15,
        description: 'Lightweight neon yellow scrimmage vests with reinforced collar and armholes for practice matches.',
        status: 'approved',
        images: ['https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80']
      },
      // Goalkeeper
      {
        seller: 'seller.gear@matchfix.dev',
        title: 'Reusch Attrakt Freegel Fusion Ortho-Tec Gloves',
        category: 'Goalkeeper',
        price: 3800.00,
        condition: 'new',
        stock: 8,
        description: 'Removable finger protection spines with German Grip Gold X latex palm for pro shot stopping in all weather.',
        status: 'approved',
        images: ['https://images.unsplash.com/photo-1563299796-17596ed6b017?auto=format&fit=crop&w=800&q=80']
      },
      // Pending Demo Product
      {
        seller: 'seller.pending@matchfix.dev',
        title: 'Puma King Top FG Heritage Edition',
        category: 'Boots',
        price: 6800.00,
        condition: 'new',
        stock: 5,
        description: 'Retro classic leather silhouette awaiting verification from newly registered merchant.',
        status: 'pending', // Demonstrates pending product approval in Admin Dashboard!
        images: ['https://images.unsplash.com/photo-1552667466-07770ae110d0?auto=format&fit=crop&w=800&q=80']
      },
    ];

    const prodIdMap = {};
    for (const p of productsData) {
      const sId = sellerMap[p.seller];
      const pRes = await client.query(
        `INSERT INTO products (seller_id, title, price, category, condition, stock, description, approval_status, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
         RETURNING product_id`,
        [sId, p.title, p.price, p.category, p.condition, p.stock, p.description, p.status]
      );
      const prodId = pRes.rows[0].product_id;
      prodIdMap[p.title] = prodId;

      for (let i = 0; i < p.images.length; i++) {
        await client.query(
          `INSERT INTO product_images (product_id, url, is_cover) VALUES ($1, $2, $3)`,
          [prodId, p.images[i], i === 0]
        );
      }
    }
    console.log(`✅ ${productsData.length} marketplace products seeded.`);

    // -------------------------------------------------------------------------
    // 9. Wishlist Items
    // -------------------------------------------------------------------------
    console.log('❤️ Seeding customer wishlist items...');
    const tanvirId = customerMap['customer.tanvir@matchfix.dev'];
    const rafiId = customerMap['customer.rafi@matchfix.dev'];

    const bootProdId = prodIdMap['Nike Phantom GX Elite FG'];
    const ballProdId = prodIdMap['Nike Flight Match Ball (BFF Spec Size 5)'];
    const kitProdId = prodIdMap['Bangladesh National Team 2026 Home Kit'];

    if (bootProdId) await client.query(`INSERT INTO product_wishlist (user_id, product_id) VALUES ($1, $2)`, [tanvirId, bootProdId]);
    if (ballProdId) await client.query(`INSERT INTO product_wishlist (user_id, product_id) VALUES ($1, $2)`, [tanvirId, ballProdId]);
    if (kitProdId) await client.query(`INSERT INTO product_wishlist (user_id, product_id) VALUES ($1, $2)`, [rafiId, kitProdId]);
    console.log('✅ Customer wishlist seeded.');

    // -------------------------------------------------------------------------
    // 10. Sample Completed & Upcoming Bookings with Reviews & Payments
    // -------------------------------------------------------------------------
    console.log('🏟️ Seeding turf bookings, reviews & payment transactions...');

    // Past completed booking 1 (Greenline Turf Alpha pitch)
    const field1 = allFieldIds[2]; // Greenline Alpha
    const bk1 = await client.query(
      `INSERT INTO bookings (customer_id, status, total_amount, payment_method, created_at)
       VALUES ($1, 'completed', 1400.00, 'bkash', NOW() - INTERVAL '3 days')
       RETURNING booking_id`,
      [tanvirId]
    );
    const bk1Id = bk1.rows[0].booking_id;
    await client.query(
      `INSERT INTO booking_slots (booking_id, field_id, slot_date, start_time)
       VALUES ($1, $2, CURRENT_DATE - INTERVAL '3 days', '19:00:00')`,
      [bk1Id, field1]
    );
    await client.query(
      `INSERT INTO payments (booking_id, amount, method, status, purpose)
       VALUES ($1, 1400.00, 'bkash', 'completed', 'full')`,
      [bk1Id]
    );
    await client.query(
      `INSERT INTO turf_reviews (booking_id, rating, comment, created_at)
       VALUES ($1, 5, 'Top quality 5-a-side pitch in Dhanmondi. Floodlights and locker rooms were great!', NOW() - INTERVAL '2 days')`,
      [bk1Id]
    );

    // Past completed booking 2 (Jaff Arena Pitch 1)
    const field0 = allFieldIds[0]; // Jaff Pitch 1
    const bk2 = await client.query(
      `INSERT INTO bookings (customer_id, status, total_amount, payment_method, created_at)
       VALUES ($1, 'completed', 1800.00, 'nagad', NOW() - INTERVAL '2 days')
       RETURNING booking_id`,
      [rafiId]
    );
    const bk2Id = bk2.rows[0].booking_id;
    await client.query(
      `INSERT INTO booking_slots (booking_id, field_id, slot_date, start_time)
       VALUES ($1, $2, CURRENT_DATE - INTERVAL '2 days', '20:00:00')`,
      [bk2Id, field0]
    );
    await client.query(
      `INSERT INTO payments (booking_id, amount, method, status, purpose)
       VALUES ($1, 1800.00, 'nagad', 'completed', 'full')`,
      [bk2Id]
    );
    await client.query(
      `INSERT INTO turf_reviews (booking_id, rating, comment, created_at)
       VALUES ($1, 5, 'Best turf in Bashundhara! German grass is soft on joints and the rooftop cafe is awesome.', NOW() - INTERVAL '1 day')`,
      [bk2Id]
    );

    // Upcoming Confirmed Booking (Tomorrow 19:00 at Kickoff Arena Banani)
    const kickoffField = allFieldIds[1];
    const bk3 = await client.query(
      `INSERT INTO bookings (customer_id, status, total_amount, payment_method, created_at)
       VALUES ($1, 'confirmed', 1600.00, 'card', NOW())
       RETURNING booking_id`,
      [tanvirId]
    );
    const bk3Id = bk3.rows[0].booking_id;
    await client.query(
      `INSERT INTO booking_slots (booking_id, field_id, slot_date, start_time)
       VALUES ($1, $2, CURRENT_DATE + INTERVAL '1 day', '19:00:00')`,
      [bk3Id, kickoffField]
    );
    await client.query(
      `INSERT INTO payments (booking_id, amount, method, status, purpose)
       VALUES ($1, 1600.00, 'card', 'completed', 'full')`,
      [bk3Id]
    );
    console.log('✅ Bookings, turf reviews & booking payments seeded.');

    // -------------------------------------------------------------------------
    // 11. Sample Orders, Product Reviews & Payments
    // -------------------------------------------------------------------------
    console.log('📦 Seeding marketplace orders, reviews & cash advances...');

    // Order 1: Delivered (Bangladesh Jersey + Grip Socks) for Tanvir
    const ord1 = await client.query(
      `INSERT INTO orders (customer_id, total_amount, status, payment_method, advance_amount, cash_balance, delivery_address, delivery_phone, created_at)
       VALUES ($1, 2200.00, 'delivered', 'online', 0.00, 0.00, 'House 14, Road 27, Dhanmondi, Dhaka', '01914000001', NOW() - INTERVAL '4 days')
       RETURNING order_id`,
      [tanvirId]
    );
    const ord1Id = ord1.rows[0].order_id;
    const bdJerseyId = prodIdMap['Bangladesh National Team 2026 Home Kit'];
    const gripSocksId = prodIdMap['MatchFix Non-Slip Grip Socks (3-Pack Bundle)'];

    await client.query(
      `INSERT INTO order_items (order_id, product_id, qty, unit_price, status) VALUES
        ($1, $2, 1, 1450.00, 'delivered'),
        ($1, $3, 1, 750.00, 'delivered')`,
      [ord1Id, bdJerseyId, gripSocksId]
    );
    await client.query(
      `INSERT INTO payments (order_id, amount, method, status, purpose)
       VALUES ($1, 2200.00, 'bkash', 'completed', 'full')`,
      [ord1Id]
    );
    // Verified product review
    await client.query(
      `INSERT INTO product_reviews (order_id, product_id, rating, comment, created_at)
       VALUES ($1, $2, 5, 'Authentic fabric quality! Breathable and fits true to size. Delivery to Dhanmondi took only 24 hours.', NOW() - INTERVAL '2 days')`,
      [ord1Id, bdJerseyId]
    );

    // Order 2: Delivered (Nike Phantom Boots) for Rafi
    const ord2 = await client.query(
      `INSERT INTO orders (customer_id, total_amount, status, payment_method, advance_amount, cash_balance, delivery_address, delivery_phone, created_at)
       VALUES ($1, 8500.00, 'delivered', 'online', 0.00, 0.00, 'Flat 5B, Block D, Bashundhara R/A, Dhaka', '01914000002', NOW() - INTERVAL '5 days')
       RETURNING order_id`,
      [rafiId]
    );
    const ord2Id = ord2.rows[0].order_id;
    await client.query(
      `INSERT INTO order_items (order_id, product_id, qty, unit_price, status)
       VALUES ($1, $2, 1, 8500.00, 'delivered')`,
      [ord2Id, bootProdId]
    );
    await client.query(
      `INSERT INTO payments (order_id, amount, method, status, purpose)
       VALUES ($1, 8500.00, 'card', 'completed', 'full')`,
      [ord2Id]
    );
    await client.query(
      `INSERT INTO product_reviews (order_id, product_id, rating, comment, created_at)
       VALUES ($1, $2, 5, 'Superb grip on artificial grass. The texture allows sharp dipping shots. 100% authentic.', NOW() - INTERVAL '3 days')`,
      [ord2Id, bootProdId]
    );

    // Order 3: Cash on Delivery with 20% Advance Paid (Adidas UCL Match Ball) for Mehedi
    // Total 4500 BDT -> Advance paid: 900 BDT, Cash balance due: 3600 BDT
    const ord3 = await client.query(
      `INSERT INTO orders (customer_id, total_amount, status, payment_method, advance_amount, cash_balance, delivery_address, delivery_phone, created_at)
       VALUES ($1, 4500.00, 'advance_paid', 'cash_advance', 900.00, 3600.00, 'House 22, Road 11, Banani, Dhaka', '01914000003', NOW() - INTERVAL '1 day')
       RETURNING order_id`,
      [customerMap['customer.mehedi@matchfix.dev']]
    );
    const ord3Id = ord3.rows[0].order_id;
    const uclBallId = prodIdMap['Adidas UCL Pro Istanbul Match Ball'];
    await client.query(
      `INSERT INTO order_items (order_id, product_id, qty, unit_price, status)
       VALUES ($1, $2, 1, 4500.00, 'placed')`,
      [ord3Id, uclBallId]
    );
    await client.query(
      `INSERT INTO payments (order_id, amount, method, status, purpose, is_advance)
       VALUES ($1, 900.00, 'nagad', 'completed', 'advance', TRUE)`,
      [ord3Id]
    );
    console.log('✅ Orders, product reviews & cash-advance transactions seeded.');

    // -------------------------------------------------------------------------
    // 12. Admin Security & Activity Audit Trail
    // -------------------------------------------------------------------------
    console.log('🛡️ Seeding administrative audit trail...');
    await client.query(`
      INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, details, ip_address) VALUES
        ($1, 'approve_organizer', 'organizer', '1', '{"notes": "Verified Trade Licence TL-DHK-2024-881 for Jaff Arena"}'::jsonb, '127.0.0.1'),
        ($1, 'approve_turf', 'turf', '1', '{"name": "Jaff Arena Bashundhara", "status": "approved"}'::jsonb, '127.0.0.1'),
        ($1, 'update_settings', 'platform_settings', 'commission_rate', '{"old": "10", "new": "8"}'::jsonb, '127.0.0.1'),
        ($1, 'update_broadcast', 'platform_settings', 'broadcast_message', '{"message": "⚽ Welcome to MatchFix! Book top football arenas across Dhaka."}'::jsonb, '127.0.0.1')
    `, [adminId1]);
    console.log('✅ Admin audit trail logs populated.');

    console.log('\n======================================================================');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('======================================================================');
    console.log('📌 Test Account Credentials:');
    console.log('   Universal Password: Passw0rd!');
    console.log('   Super Admin:        admin@matchfix.dev (01711000001)');
    console.log('   Organizers:         organizer.jaff@matchfix.dev, organizer.kickoff@matchfix.dev, organizer.greenline@matchfix.dev');
    console.log('   Sellers:            seller.boots@matchfix.dev, seller.kits@matchfix.dev, seller.gear@matchfix.dev');
    console.log('   Customers:          customer.tanvir@matchfix.dev, customer.rafi@matchfix.dev, customer.mehedi@matchfix.dev');
    console.log('======================================================================\n');

  } catch (err) {
    console.error('❌ Seeding failed with error:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await db.pool.end();
    console.log('🔌 PostgreSQL connection pool cleanly closed.');
  }
}

main();
