const db = require('../config/db');
const { buildUserPayload } = require('../utils/authPayload');

/**
 * GET /api/admin/stats
 * Aggregate dashboard statistics and system KPIs
 */
async function getStats(req, res) {
  try {
    const [
      usersCount,
      activeUsersCount,
      organizersCount,
      sellersCount,
      customersCount,
      turfsCount,
      fieldsCount,
      bookingsCount,
      confirmedBookingsCount,
      productsCount,
      ordersCount,
      revenueResult,
    ] = await Promise.all([
      db.query('SELECT COUNT(*)::int AS count FROM users'),
      db.query('SELECT COUNT(*)::int AS count FROM users WHERE is_active = TRUE'),
      db.query('SELECT COUNT(*)::int AS count FROM organizers'),
      db.query('SELECT COUNT(*)::int AS count FROM sellers'),
      db.query('SELECT COUNT(*)::int AS count FROM customers'),
      db.query('SELECT COUNT(*)::int AS count FROM turfs'),
      db.query('SELECT COUNT(*)::int AS count FROM fields'),
      db.query('SELECT COUNT(*)::int AS count FROM bookings'),
      db.query("SELECT COUNT(*)::int AS count FROM bookings WHERE status = 'confirmed'"),
      db.query('SELECT COUNT(*)::int AS count FROM products'),
      db.query('SELECT COUNT(*)::int AS count FROM orders'),
      db.query("SELECT COALESCE(SUM(amount), 0)::numeric AS revenue FROM payments WHERE status = 'completed'"),
    ]);

    return res.json({
      total_users: usersCount.rows[0].count,
      active_users: activeUsersCount.rows[0].count,
      total_organizers: organizersCount.rows[0].count,
      total_sellers: sellersCount.rows[0].count,
      total_customers: customersCount.rows[0].count,
      total_turfs: turfsCount.rows[0].count,
      total_fields: fieldsCount.rows[0].count,
      total_bookings: bookingsCount.rows[0].count,
      confirmed_bookings: confirmedBookingsCount.rows[0].count,
      total_products: productsCount.rows[0].count,
      total_orders: ordersCount.rows[0].count,
      total_revenue: parseFloat(revenueResult.rows[0].revenue) || 0,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/admin/users
 * Paginated and filterable user directory for admins
 */
async function listUsers(req, res) {
  const { search, role, status, limit = 50, offset = 0 } = req.query;

  try {
    let baseQuery = `
      SELECT 
        u.user_id, 
        u.name, 
        u.email, 
        u.phone, 
        u.is_active, 
        u.is_admin, 
        u.created_at,
        ARRAY_REMOVE(ARRAY[
          CASE WHEN o.user_id IS NOT NULL THEN 'organizer' END,
          CASE WHEN s.user_id IS NOT NULL THEN 'seller' END,
          CASE WHEN c.user_id IS NOT NULL THEN 'customer' END
        ], NULL) AS roles
      FROM users u
      LEFT JOIN organizers o ON u.user_id = o.user_id
      LEFT JOIN sellers s ON u.user_id = s.user_id
      LEFT JOIN customers c ON u.user_id = c.user_id
    `;

    const conditions = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.phone ILIKE $${params.length})`);
    }

    if (status === 'active') {
      conditions.push('u.is_active = TRUE');
    } else if (status === 'inactive') {
      conditions.push('u.is_active = FALSE');
    }

    if (role === 'admin') {
      conditions.push('u.is_admin = TRUE');
    } else if (role === 'organizer') {
      conditions.push('o.user_id IS NOT NULL');
    } else if (role === 'seller') {
      conditions.push('s.user_id IS NOT NULL');
    } else if (role === 'customer') {
      conditions.push('c.user_id IS NOT NULL');
    }

    if (conditions.length > 0) {
      baseQuery += ' WHERE ' + conditions.join(' AND ');
    }

    // Get count for pagination
    const countSql = `SELECT COUNT(*) AS total FROM (${baseQuery}) AS filtered`;
    const countRes = await db.query(countSql, params);
    const total = parseInt(countRes.rows[0].total, 10);

    // Add ordering and pagination
    params.push(Number(limit));
    const limitIdx = params.length;
    params.push(Number(offset));
    const offsetIdx = params.length;

    const dataSql = `${baseQuery} ORDER BY u.created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
    const { rows } = await db.query(dataSql, params);

    return res.json({
      total,
      limit: Number(limit),
      offset: Number(offset),
      users: rows.map(u => ({
        ...u,
        is_admin: u.is_admin === true,
        is_active: u.is_active === true,
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/admin/users/:id
 * Detailed user information including role profile records and activity counts
 */
async function getUser(req, res) {
  const { id } = req.params;

  try {
    const { rows } = await db.query(
      `SELECT user_id, name, email, phone, is_active, is_admin, created_at 
       FROM users WHERE user_id = $1`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const [organizer, seller, customer, bookingsCount, ordersCount, turfsCount, productsCount] = await Promise.all([
      db.query('SELECT * FROM organizers WHERE user_id = $1', [id]),
      db.query('SELECT * FROM sellers WHERE user_id = $1', [id]),
      db.query('SELECT * FROM customers WHERE user_id = $1', [id]),
      db.query('SELECT COUNT(*)::int AS count FROM bookings WHERE customer_id = $1', [id]),
      db.query('SELECT COUNT(*)::int AS count FROM orders WHERE customer_id = $1', [id]),
      db.query('SELECT COUNT(*)::int AS count FROM turfs WHERE organizer_id = $1', [id]),
      db.query('SELECT COUNT(*)::int AS count FROM products WHERE seller_id = $1', [id]),
    ]);

    const payload = await buildUserPayload(id);

    return res.json({
      ...payload,
      organizer: organizer.rows[0] || null,
      seller: seller.rows[0] || null,
      customer: customer.rows[0] || null,
      activity: {
        bookings_count: bookingsCount.rows[0].count,
        orders_count: ordersCount.rows[0].count,
        turfs_count: turfsCount.rows[0].count,
        products_count: productsCount.rows[0].count,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/admin/users/:id
 * Update user details or toggle status / admin rights
 */
async function updateUser(req, res) {
  const { id } = req.params;
  const { name, phone, is_active, is_admin } = req.body;

  // Prevent admin from removing their own admin status or deactivating themselves
  if (Number(id) === req.user.user_id) {
    if (is_admin === false) {
      return res.status(400).json({ error: 'You cannot revoke your own admin rights.' });
    }
    if (is_active === false) {
      return res.status(400).json({ error: 'You cannot deactivate your own account.' });
    }
  }

  try {
    const updated = await db.withTransaction(async (client) => {
      const check = await client.query('SELECT user_id FROM users WHERE user_id = $1 FOR UPDATE', [id]);
      if (!check.rows.length) {
        throw new Error('User not found.');
      }

      const { rows } = await client.query(
        `UPDATE users
         SET name = COALESCE($1, name),
             phone = COALESCE($2, phone),
             is_active = COALESCE($3, is_active),
             is_admin = COALESCE($4, is_admin)
         WHERE user_id = $5
         RETURNING user_id, name, email, phone, is_active, is_admin, created_at`,
        [name, phone, is_active, is_admin, id]
      );
      return rows[0];
    });

    const userPayload = await buildUserPayload(id);
    return res.json({
      user: userPayload,
      message: 'User updated successfully.',
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * DELETE /api/admin/users/:id
 * Soft-deletes by default, supports ?hard=true for complete record removal
 */
async function deleteUser(req, res) {
  const { id } = req.params;
  const { hard } = req.query;

  if (Number(id) === req.user.user_id) {
    return res.status(400).json({ error: 'You cannot delete your own admin account.' });
  }

  try {
    await db.withTransaction(async (client) => {
      const check = await client.query('SELECT user_id FROM users WHERE user_id = $1 FOR UPDATE', [id]);
      if (!check.rows.length) {
        throw new Error('User not found.');
      }

      if (hard === 'true') {
        await client.query('DELETE FROM users WHERE user_id = $1', [id]);
      } else {
        await client.query('UPDATE users SET is_active = FALSE WHERE user_id = $1', [id]);
      }
    });

    return res.json({
      message: hard === 'true' ? 'User permanently deleted.' : 'User deactivated successfully.',
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

module.exports = {
  getStats,
  listUsers,
  getUser,
  updateUser,
  deleteUser,
};
