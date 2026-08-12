const bcrypt = require('bcryptjs');
const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sign } = require('../utils/jwt');
const { getRolesForUser } = require('../utils/roles');

// POST /api/auth/register
// Creates the base User row only. Roles (Organizer/Seller/Customer) are
// added afterwards via POST /api/users/me/roles/:role — this mirrors the
// ERD, where isA is overlapping+partial and a plain User may hold zero
// or many roles.
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, 'name, email and password are required');
  }

  const existing = await db.query('SELECT 1 FROM users WHERE email = $1', [email]);
  if (existing.rowCount) throw new ApiError(409, 'Email is already registered');

  const password_hash = await bcrypt.hash(password, 10);
  const { rows } = await db.query(
    `INSERT INTO users (name, email, phone, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING user_id, name, email, phone, is_active, created_at`,
    [name, email, phone || null, password_hash]
  );
  const user = rows[0];
  const roles = [];
  const token = sign({ user_id: user.user_id, name: user.name, email: user.email, roles });

  res.status(201).json({ user: { ...user, roles }, token });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'email and password are required');

  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];
  if (!user || !user.is_active) throw new ApiError(401, 'Invalid credentials');

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw new ApiError(401, 'Invalid credentials');

  const roles = await getRolesForUser(user.user_id);
  const token = sign({ user_id: user.user_id, name: user.name, email: user.email, roles });

  delete user.password_hash;
  res.json({ user: { ...user, roles }, token });
});

// POST /api/auth/refresh  (requires a currently-valid token)
// Re-reads the user's roles from the database and issues a fresh JWT —
// call this right after adding a new role (organizer/seller/customer) so
// the client doesn't have to force a full re-login to use it.
const refresh = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    'SELECT user_id, name, email FROM users WHERE user_id = $1 AND is_active = TRUE',
    [req.user.user_id]
  );
  if (!rows[0]) throw new ApiError(401, 'User no longer exists');

  const roles = await getRolesForUser(rows[0].user_id);
  const token = sign({ user_id: rows[0].user_id, name: rows[0].name, email: rows[0].email, roles });
  res.json({ token, roles });
});

module.exports = { register, login, refresh };
