const db = require('../config/db');

// A User can simultaneously be an Organizer, a Seller, and a Customer
// (overlapping specialization) — this helper returns every role a user
// currently holds so it can be embedded in the JWT and checked by
// requireRole().
async function getRolesForUser(userId) {
  const [org, sel, cus] = await Promise.all([
    db.query("SELECT approval_status FROM organizers WHERE user_id = $1 AND approval_status = 'approved'", [userId]),
    db.query("SELECT approval_status FROM sellers WHERE user_id = $1 AND approval_status = 'approved'", [userId]),
    db.query('SELECT 1 FROM customers WHERE user_id = $1', [userId]),
  ]);
  const roles = [];
  if (org.rowCount) roles.push('organizer');
  if (sel.rowCount) roles.push('seller');
  if (cus.rowCount) roles.push('customer');
  return roles;
}

module.exports = { getRolesForUser };
