const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../config/db');
const { sign } = require('../utils/jwt');
const { buildUserPayload } = require('../utils/authPayload');
const {
  isValidEmail,
  isValidPhone,
  normalizePhone,
  isValidPassword,
} = require('../utils/validators');

/**
 * Resolve user roles across subclasses
 */
async function getUserRoles(userId, client = db) {
  const { rows } = await client.query(
    `SELECT
      CASE WHEN o.user_id IS NOT NULL AND o.approval_status = 'approved' THEN TRUE ELSE FALSE END AS is_organizer,
      CASE WHEN s.user_id IS NOT NULL AND s.approval_status = 'approved' THEN TRUE ELSE FALSE END AS is_seller,
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
  const {
    name,
    email,
    phone,
    password,
    confirmPassword,
    confirm_password,
    role = 'customer',
    trade_licence,
    payout_account,
    shop_name,
    address,
  } = req.body;

  // 1. Full name validation
  const trimmedName = (name || '').trim();
  if (!trimmedName || trimmedName.length < 2) {
    return res.status(400).json({ error: 'Full name is required (at least 2 characters).' });
  }

  // 2. Email format validation
  const trimmedEmail = (email || '').trim().toLowerCase();
  if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  // 3. Bangladeshi Phone number validation
  const rawPhone = (phone || '').trim();
  if (!rawPhone || !isValidPhone(rawPhone)) {
    return res.status(400).json({
      error: 'Please enter a valid Bangladeshi phone number (e.g., 017XXXXXXXX or +88017XXXXXXXX).',
    });
  }
  const normalizedPhone = normalizePhone(rawPhone);

  // 4. Password validation
  if (!password || !isValidPassword(password)) {
    return res.status(400).json({ error: 'Password must be between 6 and 128 characters.' });
  }

  // 5. Password confirmation validation
  const confirm = confirmPassword !== undefined ? confirmPassword : confirm_password;
  if (confirm !== undefined && confirm !== password) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  // 6. Role validation
  const validRoles = ['customer', 'organizer', 'seller'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
  }

  // 7. Role-specific extra information validation
  if (role === 'organizer') {
    if (!trade_licence || !trade_licence.trim()) {
      return res.status(400).json({ error: 'Trade licence number is required for turf organizers.' });
    }
    if (!payout_account || !payout_account.trim()) {
      return res.status(400).json({ error: 'Payout account details (bKash/Nagad/Bank) are required for organizers.' });
    }
  } else if (role === 'seller') {
    if (!shop_name || !shop_name.trim()) {
      return res.status(400).json({ error: 'Shop or merchant name is required for gear sellers.' });
    }
    if (!payout_account || !payout_account.trim()) {
      return res.status(400).json({ error: 'Payout account details (bKash/Nagad/Bank) are required for sellers.' });
    }
  }

  try {
    const user = await db.withTransaction(async (client) => {
      // Check existing email
      const existingEmail = await client.query('SELECT user_id FROM users WHERE LOWER(email) = LOWER($1)', [trimmedEmail]);
      if (existingEmail.rows.length) {
        throw new Error('An account with this email already exists.');
      }

      // Check existing phone
      const existingPhone = await client.query('SELECT user_id FROM users WHERE phone = $1', [normalizedPhone]);
      if (existingPhone.rows.length) {
        throw new Error('An account with this phone number already exists.');
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const userRes = await client.query(
        `INSERT INTO users (name, email, phone, password_hash, is_active, is_admin)
         VALUES ($1, LOWER($2), $3, $4, TRUE, FALSE)
         RETURNING user_id, name, email, phone, is_admin, is_active, created_at`,
        [trimmedName, trimmedEmail, normalizedPhone, passwordHash]
      );
      const newUser = userRes.rows[0];

      // Atomic subclass table population with pending approval for organizer/seller
      if (role === 'organizer') {
        await client.query(
          `INSERT INTO organizers (user_id, trade_licence, payout_account, approval_status)
           VALUES ($1, $2, $3, 'pending')`,
          [newUser.user_id, trade_licence.trim(), payout_account.trim()]
        );
        // Base customer record so organizer can still browse platform
        await client.query(
          `INSERT INTO customers (user_id, default_address) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [newUser.user_id, address ? address.trim() : null]
        );
      } else if (role === 'seller') {
        await client.query(
          `INSERT INTO sellers (user_id, shop_name, payout_account, approval_status)
           VALUES ($1, $2, $3, 'pending')`,
          [newUser.user_id, shop_name.trim(), payout_account.trim()]
        );
        // Base customer record so seller can still browse platform
        await client.query(
          `INSERT INTO customers (user_id, default_address) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [newUser.user_id, address ? address.trim() : null]
        );
      } else {
        await client.query(
          `INSERT INTO customers (user_id, default_address) VALUES ($1, $2)`,
          [newUser.user_id, address ? address.trim() : null]
        );
      }

      return newUser;
    });

    const userPayload = await buildUserPayload(user.user_id);
    const token = sign(userPayload);
    const isApprovalPending = role === 'organizer' || role === 'seller';

    return res.status(201).json({
      user: userPayload,
      token,
      message: isApprovalPending
        ? `Registration successful! Your ${role} account has been submitted for admin approval.`
        : 'Registration successful.',
      requires_approval: isApprovalPending,
      role,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * POST /api/auth/login
 * Supports logging in with either Email OR Phone number
 */
async function login(req, res) {
  const { email, phone, identifier: rawId, password } = req.body;
  const identifier = (email || phone || rawId || '').trim();

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Email or phone number, and password are required.' });
  }

  const isEmail = isValidEmail(identifier);
  const isPhone = isValidPhone(identifier);

  if (!isEmail && !isPhone) {
    return res.status(400).json({
      error: 'Please enter a valid email address or Bangladeshi phone number.',
    });
  }

  const queryEmail = isEmail ? identifier.toLowerCase() : null;
  const queryPhone = isPhone ? normalizePhone(identifier) : null;

  try {
    const { rows } = await db.query(
      `SELECT user_id, name, email, phone, password_hash, is_active, is_admin
       FROM users
       WHERE (LOWER(email) = LOWER($1) AND $1 IS NOT NULL)
          OR (phone = $2 AND $2 IS NOT NULL)`,
      [queryEmail, queryPhone]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid email/phone or password.' });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account has been deactivated. Please contact support.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email/phone or password.' });
    }

    const userPayload = await buildUserPayload(user.user_id);
    const token = sign(userPayload);

    return res.json({
      user: userPayload,
      token,
      message: 'Login successful.',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/auth/refresh
 */
async function refresh(req, res) {
  try {
    const userPayload = await buildUserPayload(req.user.user_id);
    const token = sign(userPayload);
    return res.json({ user: userPayload, token });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * GET /api/auth/me
 */
async function getMe(req, res) {
  try {
    const userPayload = await buildUserPayload(req.user.user_id);
    return res.json({ user: userPayload });
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

  let trimmedName = undefined;
  if (name !== undefined) {
    trimmedName = name.trim();
    if (trimmedName.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters.' });
    }
  }

  let normalizedPhone = undefined;
  if (phone !== undefined && phone !== null && phone !== '') {
    if (!isValidPhone(phone)) {
      return res.status(400).json({
        error: 'Please enter a valid Bangladeshi phone number (e.g. 017XXXXXXXX or +88017XXXXXXXX).',
      });
    }
    normalizedPhone = normalizePhone(phone);
  }

  try {
    const updated = await db.withTransaction(async (client) => {
      // Check phone uniqueness if phone is changing
      if (normalizedPhone) {
        const phoneCheck = await client.query(
          'SELECT user_id FROM users WHERE phone = $1 AND user_id <> $2',
          [normalizedPhone, req.user.user_id]
        );
        if (phoneCheck.rows.length) {
          throw new Error('This phone number is already registered to another account.');
        }
      }

      const userRes = await client.query(
        `UPDATE users
         SET name = COALESCE($1, name),
             phone = COALESCE($2, phone)
         WHERE user_id = $3
         RETURNING user_id, name, email, phone, is_active`,
        [trimmedName, normalizedPhone, req.user.user_id]
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
    return res.status(400).json({ error: err.message });
  }
}

/**
 * POST /api/auth/change-password
 * DML 3: Uses withTransaction to safely update password hash.
 */
async function changePassword(req, res) {
  const { current_password, new_password, confirm_password, confirmPassword } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Current and new password are required.' });
  }

  if (!isValidPassword(new_password)) {
    return res.status(400).json({ error: 'New password must be between 6 and 128 characters long.' });
  }

  const confirm = confirmPassword !== undefined ? confirmPassword : confirm_password;
  if (confirm !== undefined && confirm !== new_password) {
    return res.status(400).json({ error: 'New password and confirmation do not match.' });
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

async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email || !isValidEmail(email)) return res.status(400).json({ error: 'Valid email required' });
  
  try {
    const { rows } = await db.query('SELECT user_id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour
    
    await db.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [rows[0].user_id, token, expires]
    );
    
    // In a real app, send an email. For this prototype, we'll return it so the frontend can display it for dev testing.
    console.log(`Password reset link: http://localhost:5173/reset-password?token=${token}`);
    
    return res.json({ message: 'Password reset link generated', token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function resetPassword(req, res) {
  const { token, new_password } = req.body;
  if (!token || !new_password) return res.status(400).json({ error: 'Token and new password required' });
  if (!isValidPassword(new_password)) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  
  try {
    await db.withTransaction(async (client) => {
      const { rows } = await client.query('SELECT user_id, expires_at FROM password_resets WHERE token = $1', [token]);
      if (!rows.length) throw new Error('Invalid reset token');
      if (new Date() > rows[0].expires_at) throw new Error('Reset token has expired');
      
      const newHash = await bcrypt.hash(new_password, 10);
      await client.query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [newHash, rows[0].user_id]);
      await client.query('DELETE FROM password_resets WHERE user_id = $1', [rows[0].user_id]);
    });
    
    return res.json({ message: 'Password reset successfully' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

module.exports = {
  register,
  login,
  refresh,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword
};