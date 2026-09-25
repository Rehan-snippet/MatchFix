const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'matchfix-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

/**
 * Resolve user roles across subclasses
 */
async function getUserRoles(userId, client = db) {
  const { rows } = await client.query(
    `SELECT
      CASE WHEN o.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_organizer,
      CASE WHEN s.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_seller,
      CASE WHEN c.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_customer
    FROM users u
    LEFT JOIN organizers o ON u.user_id = o.user_id
    LEFT JOIN sellers s ON u.user_id = s.user_id
    LEFT JOIN customers c ON u.user_id = c.user_id
    WHERE u.user_id = $1`,
    [userId]
  );

  const roles = [];
  if (rows.length) {
    if (rows[0].is_organizer) roles.push('organizer');
    if (rows[0].is_seller) roles.push('seller');
    if (rows[0].is_customer) roles.push('customer');
  }
  return roles;
}

/**
 * POST /api/auth/register
 * DML 1: Uses withTransaction to guarantee user and role subclass creation are atomic.
 */
async function register(req, res) {
  const { name, email, phone, password, role = 'customer', trade_licence, payout_account, shop_name, address } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const validRoles = ['customer', 'organizer', 'seller'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
  }

  try {
    const user = await db.withTransaction(async (client) => {
      // Check existing email
      const existing = await client.query('SELECT user_id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
      if (existing.rows.length) {
        throw new Error('An account with this email already exists.');
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const userRes = await client.query(
        `INSERT INTO users (name, email, phone, password_hash, is_active)
         VALUES ($1, LOWER($2), $3, $4, TRUE)
         RETURNING user_id, name, email, phone, created_at`,
        [name, email, phone || null, passwordHash]
      );
      const newUser = userRes.rows[0];

      // Atomic subclass table population
      if (role === 'organizer') {
        await client.query(
          `INSERT INTO organizers (user_id, trade_licence, payout_account) VALUES ($1, $2, $3)`,
          [newUser.user_id, trade_licence || null, payout_account || null]
        );
      } else if (role === 'seller') {
        await client.query(
          `INSERT INTO sellers (user_id, shop_name, payout_account) VALUES ($1, $2, $3)`,
          [newUser.user_id, shop_name || name, payout_account || null]
        );
      } else {
        await client.query(
          `INSERT INTO customers (user_id, default_address) VALUES ($1, $2)`,
          [newUser.user_id, address || null]
        );
      }

      return newUser;
    });

    const roles = await getUserRoles(user.user_id);
    const token = jwt.sign({ user_id: user.user_id, email: user.email, roles }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return res.status(201).json({
      user: { ...user, roles },
      token,
      message: 'Registration successful.',
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const { rows } = await db.query(
      `SELECT user_id, name, email, phone, password_hash, is_active
       FROM users
       WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account has been deactivated. Please contact support.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const roles = await getUserRoles(user.user_id);
    const token = jwt.sign({ user_id: user.user_id, email: user.email, roles }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    delete user.password_hash;

    return res.json({
      user: { ...user, roles },
      token,
      message: 'Login successful.',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/auth/me
 */
async function getMe(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT user_id, name, email, phone, is_active, created_at
       FROM users
       WHERE user_id = $1`,
      [req.user.user_id]
    );

    if (!rows.length) return res.status(404).json({ error: 'User not found.' });

    const roles = await getUserRoles(req.user.user_id);
    return res.json({ user: { ...rows[0], roles } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/auth/profile
 * DML 2: Uses withTransaction to update both base user and role data atomically.
 */
async function updateProfile(req, res) {
  const { name, phone, default_address, shop_name, trade_licence, payout_account } = req.body;

  try {
    const updated = await db.withTransaction(async (client) => {
      const userRes = await client.query(
        `UPDATE users
         SET name = COALESCE($1, name),
             phone = COALESCE($2, phone)
         WHERE user_id = $3
         RETURNING user_id, name, email, phone, is_active`,
        [name, phone, req.user.user_id]
      );

      if (default_address !== undefined) {
        await client.query(
          `UPDATE customers SET default_address = $1 WHERE user_id = $2`,
          [default_address, req.user.user_id]
        );
      }
      if (shop_name !== undefined || payout_account !== undefined) {
        await client.query(
          `UPDATE sellers
           SET shop_name = COALESCE($1, shop_name),
               payout_account = COALESCE($2, payout_account)
           WHERE user_id = $3`,
          [shop_name, payout_account, req.user.user_id]
        );
      }
      if (trade_licence !== undefined || payout_account !== undefined) {
        await client.query(
          `UPDATE organizers
           SET trade_licence = COALESCE($1, trade_licence),
               payout_account = COALESCE($2, payout_account)
           WHERE user_id = $3`,
          [trade_licence, payout_account, req.user.user_id]
        );
      }

      return userRes.rows[0];
    });

    const roles = await getUserRoles(req.user.user_id);
    return res.json({ user: { ...updated, roles }, message: 'Profile updated successfully.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/auth/change-password
 * DML 3: Uses withTransaction to safely update password hash.
 */
async function changePassword(req, res) {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Current and new password are required.' });
  }

  try {
    await db.withTransaction(async (client) => {
      const { rows } = await client.query('SELECT password_hash FROM users WHERE user_id = $1 FOR UPDATE', [
        req.user.user_id,
      ]);
      if (!rows.length) throw new Error('User not found.');

      const match = await bcrypt.compare(current_password, rows[0].password_hash);
      if (!match) throw new Error('Incorrect current password.');

      const newHash = await bcrypt.hash(new_password, 10);
      await client.query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [newHash, req.user.user_id]);
    });

    return res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
};