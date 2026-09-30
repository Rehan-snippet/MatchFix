const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { getRolesForUser } = require('../utils/roles');

// GET /api/users/me  — base profile + every role-specific record the user holds
const getMe = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    'SELECT user_id, name, email, phone, is_admin, is_active, created_at FROM users WHERE user_id = $1',
    [req.user.user_id]
  );
  if (!rows[0]) throw new ApiError(404, 'User not found');

  const [organizer, seller, customer] = await Promise.all([
    db.query('SELECT * FROM organizers WHERE user_id = $1', [req.user.user_id]),
    db.query('SELECT * FROM sellers WHERE user_id = $1', [req.user.user_id]),
    db.query('SELECT * FROM customers WHERE user_id = $1', [req.user.user_id]),
  ]);

  res.json({
    ...rows[0],
    is_admin: rows[0].is_admin === true,
    roles: await getRolesForUser(req.user.user_id),
    organizer: organizer.rows[0] || null,
    seller: seller.rows[0] || null,
    customer: customer.rows[0] || null,
  });
});

// PATCH /api/users/me — update base user fields
// Uses explicit transaction control (withTransaction)
const updateMe = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const user = await db.withTransaction(async (client) => {
    const { rows } = await client.query(
      `UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone)
       WHERE user_id = $3
       RETURNING user_id, name, email, phone, is_admin, is_active, created_at`,
      [name, phone, req.user.user_id]
    );
    return rows[0];
  });
  res.json(user);
});

// PUT /api/users/me/password — update user password
const bcrypt = require('bcryptjs');
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Current and new passwords are required');
  }

  const { rows } = await db.query('SELECT password_hash FROM users WHERE user_id = $1', [req.user.user_id]);
  if (!rows[0]) throw new ApiError(404, 'User not found');

  const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!valid) throw new ApiError(400, 'Incorrect current password');

  const hashed = await bcrypt.hash(newPassword, 10);
  await db.query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [hashed, req.user.user_id]);

  res.json({ success: true, message: 'Password updated successfully' });
});

// POST /api/users/me/roles/organizer  { trade_licence, payout_account }
// Uses explicit transaction control (withTransaction)
const becomeOrganizer = asyncHandler(async (req, res) => {
  const { trade_licence, payout_account } = req.body;
  const organizer = await db.withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO organizers (user_id, trade_licence, payout_account)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
         SET trade_licence = EXCLUDED.trade_licence, payout_account = EXCLUDED.payout_account
       RETURNING *`,
      [req.user.user_id, trade_licence || null, payout_account || null]
    );
    return rows[0];
  });
  res.status(201).json(organizer);
});

// POST /api/users/me/roles/seller  { shop_name, payout_account }
// Uses explicit transaction control (withTransaction)
const becomeSeller = asyncHandler(async (req, res) => {
  const { shop_name, payout_account } = req.body;
  if (!shop_name) throw new ApiError(400, 'shop_name is required');
  const seller = await db.withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO sellers (user_id, shop_name, payout_account)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
         SET shop_name = EXCLUDED.shop_name, payout_account = EXCLUDED.payout_account
       RETURNING *`,
      [req.user.user_id, shop_name, payout_account || null]
    );
    return rows[0];
  });
  res.status(201).json(seller);
});

// POST /api/users/me/roles/customer  { default_address }
// Uses explicit transaction control (withTransaction)
const becomeCustomer = asyncHandler(async (req, res) => {
  const { default_address } = req.body;
  const customer = await db.withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO customers (user_id, default_address)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET default_address = EXCLUDED.default_address
       RETURNING *`,
      [req.user.user_id, default_address || null]
    );
    return rows[0];
  });
  res.status(201).json(customer);
});

const updateCustomer = asyncHandler(async (req, res) => {
  const { default_address } = req.body;
  const { rows } = await db.query(
    `UPDATE customers SET default_address = $1 WHERE user_id = $2 RETURNING *`,
    [default_address, req.user.user_id]
  );
  if (!rows[0]) throw new ApiError(404, 'Customer role not found');
  res.json(rows[0]);
});

const updateOrganizer = asyncHandler(async (req, res) => {
  const { payout_account } = req.body;
  const { rows } = await db.query(
    `UPDATE organizers SET payout_account = COALESCE($1, payout_account) WHERE user_id = $2 RETURNING *`,
    [payout_account, req.user.user_id]
  );
  if (!rows[0]) throw new ApiError(404, 'Organizer role not found');
  res.json(rows[0]);
});

const updateSeller = asyncHandler(async (req, res) => {
  const { payout_account } = req.body;
  const { rows } = await db.query(
    `UPDATE sellers SET payout_account = COALESCE($1, payout_account) WHERE user_id = $2 RETURNING *`,
    [payout_account, req.user.user_id]
  );
  if (!rows[0]) throw new ApiError(404, 'Seller role not found');
  res.json(rows[0]);
});

const getWishlist = asyncHandler(async (req, res) => {
  const { rows } = await db.query(`
    SELECT p.*, pw.created_at as added_at,
           (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.product_id AND pi.is_cover = TRUE LIMIT 1) AS cover_image
    FROM product_wishlist pw
    JOIN products p ON pw.product_id = p.product_id
    WHERE pw.user_id = $1
    ORDER BY pw.created_at DESC
  `, [req.user.user_id]);
  res.json(rows);
});

const addWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  await db.query(
    'INSERT INTO product_wishlist (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [req.user.user_id, productId]
  );
  res.json({ success: true });
});

const removeWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  await db.query(
    'DELETE FROM product_wishlist WHERE user_id = $1 AND product_id = $2',
    [req.user.user_id, productId]
  );
  res.json({ success: true });
});

module.exports = { getMe, updateMe, updatePassword, becomeOrganizer, becomeSeller, becomeCustomer, updateCustomer, updateOrganizer, updateSeller, getWishlist, addWishlist, removeWishlist };
