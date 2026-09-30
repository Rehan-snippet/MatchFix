const db = require('../config/db');
const { getRolesForUser } = require('./roles');

/**
 * Builds standard user payload for JWT signing and auth responses
 * @param {number} userId 
 * @param {object} [client] - optional pg client for transactions
 * @returns {Promise<object>}
 */
async function buildUserPayload(userId, client = db) {
  const { rows } = await client.query(
    'SELECT user_id, name, email, phone, is_admin, is_active, created_at FROM users WHERE user_id = $1',
    [userId]
  );
  if (!rows[0]) throw new Error('User not found');
  const roles = await getRolesForUser(userId);

  const [orgRes, selRes, cusRes] = await Promise.all([
    client.query('SELECT trade_licence, payout_account, approval_status FROM organizers WHERE user_id = $1', [userId]),
    client.query('SELECT shop_name, payout_account, approval_status FROM sellers WHERE user_id = $1', [userId]),
    client.query('SELECT default_address FROM customers WHERE user_id = $1', [userId]),
  ]);

  return {
    user_id: rows[0].user_id,
    name: rows[0].name,
    email: rows[0].email,
    phone: rows[0].phone,
    roles,
    organizer: orgRes.rows[0] || null,
    seller: selRes.rows[0] || null,
    customer: cusRes.rows[0] || null,
    is_admin: rows[0].is_admin === true,
    is_active: rows[0].is_active,
    created_at: rows[0].created_at,
  };
}

module.exports = { buildUserPayload };
