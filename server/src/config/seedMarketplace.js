// Seeds the marketplace with enough products to make the Marketplace page
// (and its category filter) feel real. Categories here match the
// hardcoded CATEGORIES list in client/src/pages/Marketplace.jsx exactly,
// since that filter does a case-insensitive substring match against
// products.category.
//
// Safe to re-run: no-ops once >= 30 products already exist.

const EXTRA_SELLERS = [
  {
    name: 'Champions Sports BD',
    email: 'champions.sports@matchfix.dev',
    phone: '01700000006',
    shopName: 'Champions Sports BD',
  },
  {
    name: 'Elite Football Store',
    email: 'elite.football@matchfix.dev',
    phone: '01700000007',
    shopName: 'Elite Football Store',
  },
];

// Same pre-computed bcrypt hash used in database/seed.sql (matches "Passw0rd!").
const SEED_PASSWORD_HASH =
  '$2b$10$speT22nGoWSS.pzZBalc6.Zda3pwvUJ96cSVjSHVX7T6LHOK1r9ra';

const PRODUCTS = [
  // -- Football Boots --------------------------------------------------
  {
    title: 'Nike Phantom GX Elite FG',
    category: 'Football Boots',
    description: 'Firm-ground boots with a grippy textured upper for close control.',
    price: 9200,
    condition: 'new',
    stock: 8,
    image: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Adidas Predator Elite FG',
    category: 'Football Boots',
    description: 'Rubber spike zones across the strike area for extra curl on the ball.',
    price: 8700,
    condition: 'new',
    stock: 10,
    image: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Puma Future Ultimate FG',
    category: 'Football Boots',
    description: 'Adaptive knit fit with a lightweight FUZIONFIT+ compression band.',
    price: 7900,
    condition: 'new',
    stock: 6,
    image: 'https://images.unsplash.com/photo-1552667466-07770ae110d0?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Nike Tiempo Legend 10',
    category: 'Football Boots',
    description: 'Soft kangaroo-style leather touch, lightly used, size 42.',
    price: 5200,
    condition: 'used',
    stock: 3,
    image: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Adidas Copa Pure II',
    category: 'Football Boots',
    description: 'Soft leather-look upper built for feel and touch on the ball.',
    price: 6800,
    condition: 'new',
    stock: 12,
    image: 'https://images.unsplash.com/photo-1560473354-208d1a441c33?auto=format&fit=crop&w=800&q=80',
  },

  // -- Match Balls -------------------------------------------------------
  {
    title: 'Pro Match Ball - Thermally Bonded',
    category: 'Match Balls',
    description: 'FIFA-quality thermally bonded panels for consistent flight.',
    price: 3400,
    condition: 'new',
    stock: 15,
    image: 'https://images.unsplash.com/photo-1614632537190-23e4146777db?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Training Ball - Durable Turf Edition',
    category: 'Match Balls',
    description: 'Reinforced casing built to handle rough artificial turf.',
    price: 2600,
    condition: 'new',
    stock: 18,
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Club Match Ball - Size 5',
    category: 'Match Balls',
    description: 'Standard size 5 match ball, hand-stitched panels.',
    price: 1800,
    condition: 'new',
    stock: 25,
    image: 'https://images.unsplash.com/photo-1471295253337-3ceaaedca402?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Futsal Ball - Low Bounce',
    category: 'Match Balls',
    description: 'Low-bounce core designed for indoor and futsal courts.',
    price: 2100,
    condition: 'new',
    stock: 14,
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Beach Football - Water Resistant',
    category: 'Match Balls',
    description: 'Water-resistant coating, lightweight build for beach play.',
    price: 1500,
    condition: 'new',
    stock: 20,
    image: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=800&q=80',
  },

  // -- Jerseys & Kits ------------------------------------------------------
  {
    title: 'MatchFix Pro Training Jersey',
    category: 'Jerseys & Kits',
    description: 'Breathable mesh training jersey, moisture-wicking fabric.',
    price: 1500,
    condition: 'new',
    stock: 30,
    image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Home Match Jersey - Replica Fit',
    category: 'Jerseys & Kits',
    description: 'Lightweight replica-fit jersey for match day or five-a-side.',
    price: 1800,
    condition: 'new',
    stock: 25,
    image: 'https://images.unsplash.com/photo-1509077137013-59e1a0ae1a03?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Away Match Jersey - Breathable Mesh',
    category: 'Jerseys & Kits',
    description: 'Perforated side panels for extra airflow during play.',
    price: 1850,
    condition: 'new',
    stock: 20,
    image: 'https://images.unsplash.com/photo-1571056642723-59a04ce7c583?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Full Kit Set - Jersey, Shorts & Socks',
    category: 'Jerseys & Kits',
    description: 'Complete matchday set in matching colourway.',
    price: 2600,
    condition: 'new',
    stock: 15,
    image: 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Goalkeeper Jersey - Padded',
    category: 'Jerseys & Kits',
    description: 'Padded elbow panels, long sleeve, built for keepers.',
    price: 2200,
    condition: 'new',
    stock: 10,
    image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=800&q=80',
  },

  // -- Goalkeeper Gloves ---------------------------------------------------
  {
    title: 'Predator Pro Goalkeeper Gloves',
    category: 'Goalkeeper Gloves',
    description: 'Latex palm with reinforced finger spines for extra grip.',
    price: 3200,
    condition: 'new',
    stock: 8,
    image: 'https://images.unsplash.com/photo-1600679472233-4d8a2b1d1f4b?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Elite Match Gloves - Negative Cut',
    category: 'Goalkeeper Gloves',
    description: 'Negative cut for a snug, close-to-skin fit.',
    price: 3600,
    condition: 'new',
    stock: 6,
    image: 'https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Classic Grip Training Gloves',
    category: 'Goalkeeper Gloves',
    description: 'All-weather training gloves, durable roll-finger palm.',
    price: 2400,
    condition: 'new',
    stock: 10,
    image: 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Attrakt Solid Gloves - Size 9',
    category: 'Goalkeeper Gloves',
    description: 'Lightly used, still strong grip on the palm.',
    price: 1800,
    condition: 'used',
    stock: 4,
    image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Ultra Grip Gloves - Youth Size',
    category: 'Goalkeeper Gloves',
    description: 'Sized for junior keepers, soft foam padding on the back of hand.',
    price: 2100,
    condition: 'new',
    stock: 9,
    image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=800&q=80',
  },

  // -- Training Gear ---------------------------------------------------
  {
    title: 'Agility Ladder - 6m',
    category: 'Training Gear',
    description: 'Adjustable rung agility ladder for footwork drills.',
    price: 1200,
    condition: 'new',
    stock: 20,
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Cone Set (20 pcs) with Carry Bag',
    category: 'Training Gear',
    description: 'Bright, stackable cones for drills and marking out drills.',
    price: 950,
    condition: 'new',
    stock: 25,
    image: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Resistance Band Set',
    category: 'Training Gear',
    description: 'Set of 5 bands, varying resistance, for warm-ups and strength work.',
    price: 1100,
    condition: 'new',
    stock: 18,
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Rebounder Training Net',
    category: 'Training Gear',
    description: 'Angled rebound net for solo passing and first-touch practice.',
    price: 2800,
    condition: 'new',
    stock: 6,
    image: 'https://images.unsplash.com/photo-1522778034537-20a2486be803?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Weighted Training Vest',
    category: 'Training Gear',
    description: 'Adjustable weighted vest for conditioning sessions.',
    price: 1600,
    condition: 'new',
    stock: 12,
    image: 'https://images.unsplash.com/photo-1517344884509-a0c97ec11bcc?auto=format&fit=crop&w=800&q=80',
  },

  // -- Accessories ---------------------------------------------------
  {
    title: 'Shin Guards - Pro Fit',
    category: 'Accessories',
    description: 'Lightweight ergonomic shin guards with ankle sleeve.',
    price: 900,
    condition: 'new',
    stock: 30,
    image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Football Socks (Pack of 2)',
    category: 'Accessories',
    description: 'Cushioned sole, over-the-calf match socks.',
    price: 500,
    condition: 'new',
    stock: 40,
    image: 'https://images.unsplash.com/photo-1584735175315-9d5df23860e6?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Sports Water Bottle - 1L',
    category: 'Accessories',
    description: 'BPA-free bottle with a pull-cap spout for match day.',
    price: 400,
    condition: 'new',
    stock: 50,
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Team Kit Bag - 45L',
    category: 'Accessories',
    description: 'Ventilated boot compartment, roomy main pocket.',
    price: 1800,
    condition: 'new',
    stock: 15,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: "Captain's Armband",
    category: 'Accessories',
    description: 'Elastic, one-size-fits-all captain\'s armband.',
    price: 350,
    condition: 'new',
    stock: 20,
    image: 'https://images.unsplash.com/photo-1614632537190-23e4146777db?auto=format&fit=crop&w=800&q=80',
  },
];

async function getOrCreateSeller(query, seller) {
  const { rows: existing } = await query('SELECT user_id FROM users WHERE email = $1', [seller.email]);
  if (existing.length) return existing[0].user_id;

  const { rows } = await query(
    `INSERT INTO users (name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING user_id`,
    [seller.name, seller.email, seller.phone, SEED_PASSWORD_HASH]
  );
  const userId = rows[0].user_id;

  await query(
    `INSERT INTO sellers (user_id, shop_name) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING`,
    [userId, seller.shopName]
  );

  return userId;
}

async function seedMarketplace(query) {
  try {
    const { rows: countRows } = await query('SELECT count(*) AS count FROM products');
    if (parseInt(countRows[0].count, 10) >= 30) {
      console.log('Marketplace already has 30+ products, skipping.');
      return;
    }

    console.log('Seeding marketplace sellers...');
    const { rows: baseSellerRows } = await query('SELECT user_id FROM sellers ORDER BY user_id LIMIT 1');
    const sellerIds = baseSellerRows.length ? [baseSellerRows[0].user_id] : [];

    for (const seller of EXTRA_SELLERS) {
      const sellerId = await getOrCreateSeller(query, seller);
      sellerIds.push(sellerId);
    }

    if (!sellerIds.length) {
      console.warn('No sellers available to attach products to, aborting marketplace seed.');
      return;
    }

    console.log(`Seeding ${PRODUCTS.length} marketplace products...`);
    let i = 0;
    for (const p of PRODUCTS) {
      const sellerId = sellerIds[i % sellerIds.length];
      i += 1;

      const { rows } = await query(
        `INSERT INTO products (seller_id, title, category, description, price, condition, stock)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING product_id`,
        [sellerId, p.title, p.category, p.description, p.price, p.condition, p.stock]
      );
      const productId = rows[0].product_id;

      await query(
        `INSERT INTO product_images (product_id, url, is_cover) VALUES ($1, $2, TRUE)`,
        [productId, p.image]
      );
    }

    console.log('Marketplace seeded successfully.');
  } catch (err) {
    console.error('Failed to seed marketplace:', err.message);
  }
}

module.exports = seedMarketplace;
