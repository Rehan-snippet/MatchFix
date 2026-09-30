const db = require('../config/db');
const { buildUserPayload } = require('../utils/authPayload');
const { logAdminAction } = require('../utils/auditLogger');

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
      pendingOrganizersCount,
      pendingSellersCount,
      pendingTurfsCount,
      pendingProductsCount,
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
      db.query("SELECT COUNT(*)::int AS count FROM organizers WHERE approval_status = 'pending'"),
      db.query("SELECT COUNT(*)::int AS count FROM sellers WHERE approval_status = 'pending'"),
      db.query("SELECT COUNT(*)::int AS count FROM turfs WHERE approval_status = 'pending'"),
      db.query("SELECT COUNT(*)::int AS count FROM products WHERE approval_status = 'pending'"),
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
      pending_organizers: pendingOrganizersCount.rows[0].count,
      pending_sellers: pendingSellersCount.rows[0].count,
      pending_turfs: pendingTurfsCount.rows[0].count,
      pending_products: pendingProductsCount.rows[0].count,
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

  // Security Hardening: Lockdown administrative elevation via API
  if (is_admin !== undefined) {
    return res.status(403).json({
      error: 'Administrative privileges cannot be assigned or altered via the web interface. Admin elevation is permanently locked down.',
    });
  }

  // Prevent admin from deactivating their own account
  if (Number(id) === req.user.user_id && is_active === false) {
    return res.status(400).json({ error: 'You cannot deactivate your own account.' });
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
             is_active = COALESCE($3, is_active)
         WHERE user_id = $4
         RETURNING user_id, name, email, phone, is_active, is_admin, created_at`,
        [name, phone, is_active, id]
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
 * Permanently deletes user and cascades all associated records from database.
 */
async function deleteUser(req, res) {
  const { id } = req.params;
  const { hard } = req.query;

  if (Number(id) === req.user.user_id) {
    return res.status(400).json({ error: 'You cannot delete your own admin account.' });
  }

  try {
    await db.withTransaction(async (client) => {
      const check = await client.query('SELECT user_id, name, email FROM users WHERE user_id = $1 FOR UPDATE', [id]);
      if (!check.rows.length) {
        throw new Error('User not found.');
      }

      if (hard === 'false') {
        // Soft deactivate only if explicitly requested with hard=false
        await client.query('UPDATE users SET is_active = FALSE WHERE user_id = $1', [id]);
      } else {
        // Default: complete permanent deletion from database
        await client.query('DELETE FROM users WHERE user_id = $1', [id]);
      }
    });

    return res.json({
      message: hard === 'false' ? 'User deactivated successfully.' : 'User permanently deleted from database.',
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * GET /api/admin/pending-organizers
 */
async function listPendingOrganizers(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT
         u.user_id,
         u.name,
         u.email,
         u.phone,
         u.created_at,
         o.trade_licence,
         o.payout_account,
         o.approval_status
       FROM organizers o
       JOIN users u ON o.user_id = u.user_id
       WHERE o.approval_status = 'pending'
       ORDER BY u.created_at DESC`
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/admin/pending-sellers
 */
async function listPendingSellers(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT
         u.user_id,
         u.name,
         u.email,
         u.phone,
         u.created_at,
         s.shop_name,
         s.payout_account,
         s.approval_status
       FROM sellers s
       JOIN users u ON s.user_id = u.user_id
       WHERE s.approval_status = 'pending'
       ORDER BY u.created_at DESC`
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/admin/pending-turfs
 */
async function listPendingTurfs(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT
         t.turf_id,
         t.name,
         t.address,
         t.hourly_rate,
         t.description,
         t.created_at,
         t.approval_status,
         a.name AS area_name,
         a.city,
         u.name AS organizer_name,
         u.email AS organizer_email,
         u.phone AS organizer_phone,
         (
           SELECT ti.url FROM turf_images ti
           WHERE ti.turf_id = t.turf_id AND ti.is_cover = TRUE
           LIMIT 1
         ) AS cover_image
       FROM turfs t
       JOIN areas a ON t.area_id = a.area_id
       JOIN users u ON t.organizer_id = u.user_id
       WHERE t.approval_status = 'pending'
       ORDER BY t.created_at DESC`
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/admin/pending-products
 */
async function listPendingProducts(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT
         p.product_id,
         p.title,
         p.price,
         p.category,
         p.condition,
         p.stock,
         p.description,
         p.created_at,
         p.approval_status,
         s.shop_name,
         u.name AS seller_name,
         u.email AS seller_email,
         u.phone AS seller_phone,
         (
           SELECT pi.url FROM product_images pi
           WHERE pi.product_id = p.product_id AND pi.is_cover = TRUE
           LIMIT 1
         ) AS cover_image
       FROM products p
       JOIN sellers s ON p.seller_id = s.user_id
       JOIN users u ON s.user_id = u.user_id
       WHERE p.approval_status = 'pending'
       ORDER BY p.created_at DESC`
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/admin/organizers/:id/approve
 */
async function approveOrganizer(req, res) {
  const { id } = req.params;
  try {
    const { rowCount } = await db.query(
      "UPDATE organizers SET approval_status = 'approved', rejection_reason = NULL WHERE user_id = $1",
      [id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Organizer not found.' });
    await logAdminAction(req.user.user_id, 'ORGANIZER_APPROVE', 'organizer', id, {}, req);
    return res.json({ message: 'Organizer approved successfully.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/admin/organizers/:id/reject
 */
async function rejectOrganizer(req, res) {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const { rowCount } = await db.query(
      "UPDATE organizers SET approval_status = 'rejected', rejection_reason = $1 WHERE user_id = $2",
      [reason || 'Application rejected by administration.', id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Organizer not found.' });
    await logAdminAction(req.user.user_id, 'ORGANIZER_REJECT', 'organizer', id, { reason }, req);
    return res.json({ message: 'Organizer application rejected.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/admin/sellers/:id/approve
 */
async function approveSeller(req, res) {
  const { id } = req.params;
  try {
    const { rowCount } = await db.query(
      "UPDATE sellers SET approval_status = 'approved', rejection_reason = NULL WHERE user_id = $1",
      [id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Seller not found.' });
    await logAdminAction(req.user.user_id, 'SELLER_APPROVE', 'seller', id, {}, req);
    return res.json({ message: 'Seller approved successfully.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/admin/sellers/:id/reject
 */
async function rejectSeller(req, res) {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const { rowCount } = await db.query(
      "UPDATE sellers SET approval_status = 'rejected', rejection_reason = $1 WHERE user_id = $2",
      [reason || 'Application rejected by administration.', id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Seller not found.' });
    await logAdminAction(req.user.user_id, 'SELLER_REJECT', 'seller', id, { reason }, req);
    return res.json({ message: 'Seller application rejected.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/admin/turfs/:id/approve
 */
async function approveTurf(req, res) {
  const { id } = req.params;
  try {
    const { rowCount } = await db.query(
      "UPDATE turfs SET approval_status = 'approved', rejection_reason = NULL WHERE turf_id = $1",
      [id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Turf not found.' });
    await logAdminAction(req.user.user_id, 'TURF_APPROVE', 'turf', id, {}, req);
    return res.json({ message: 'Turf venue approved successfully.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/admin/turfs/:id/reject
 */
async function rejectTurf(req, res) {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const { rowCount } = await db.query(
      "UPDATE turfs SET approval_status = 'rejected', rejection_reason = $1 WHERE turf_id = $2",
      [reason || 'Application rejected by administration.', id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Turf not found.' });
    await logAdminAction(req.user.user_id, 'TURF_REJECT', 'turf', id, { reason }, req);
    return res.json({ message: 'Turf venue listing rejected.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/admin/products/:id/approve
 */
async function approveProduct(req, res) {
  const { id } = req.params;
  try {
    const { rowCount } = await db.query(
      "UPDATE products SET approval_status = 'approved', rejection_reason = NULL WHERE product_id = $1",
      [id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Product not found.' });
    await logAdminAction(req.user.user_id, 'PRODUCT_APPROVE', 'product', id, {}, req);
    return res.json({ message: 'Product approved successfully.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/admin/products/:id/reject
 */
async function rejectProduct(req, res) {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const { rowCount } = await db.query(
      "UPDATE products SET approval_status = 'rejected', rejection_reason = $1 WHERE product_id = $2",
      [reason || 'Product rejected by administration.', id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Product not found.' });
    await logAdminAction(req.user.user_id, 'PRODUCT_REJECT', 'product', id, { reason }, req);
    return res.json({ message: 'Product listing rejected.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /api/admin/turfs/:id
 */
async function deleteTurf(req, res) {
  const { id } = req.params;
  try {
    const { rowCount } = await db.query('DELETE FROM turfs WHERE turf_id = $1', [id]);
    if (!rowCount) return res.status(404).json({ error: 'Turf venue not found.' });
    await logAdminAction(req.user.user_id, 'TURF_DELETE', 'turf', id, {}, req);
    return res.json({ message: 'Turf venue permanently deleted from database.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /api/admin/products/:id
 */
async function deleteProduct(req, res) {
  const { id } = req.params;
  try {
    const { rowCount } = await db.query('DELETE FROM products WHERE product_id = $1', [id]);
    if (!rowCount) return res.status(404).json({ error: 'Product not found.' });
    await logAdminAction(req.user.user_id, 'PRODUCT_DELETE', 'product', id, {}, req);
    return res.json({ message: 'Product permanently deleted from database.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/admin/bookings
 * Paginated and filterable global bookings list for platform administrators
 */
async function listAllBookings(req, res) {
  const { search, status, limit = 25, offset = 0 } = req.query;

  try {
    const conditions = [];
    const params = [];

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`b.status = $${params.length}`);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      params.push(term);
      const termIdx = params.length;

      let searchCond = `(u.name ILIKE $${termIdx} OR u.email ILIKE $${termIdx} OR u.phone ILIKE $${termIdx} OR t_info.turf_name ILIKE $${termIdx})`;
      if (!isNaN(Number(search.trim()))) {
        params.push(Number(search.trim()));
        searchCond += ` OR b.booking_id = $${params.length}`;
      }
      conditions.push(`(${searchCond})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const baseFromSql = `
      FROM bookings b
      JOIN users u ON b.customer_id = u.user_id
      LEFT JOIN LATERAL (
        SELECT 
          t.turf_id,
          t.name AS turf_name,
          a.name AS area_name,
          a.city,
          org_u.user_id AS organizer_id,
          org_u.name AS organizer_name,
          org_u.phone AS organizer_phone,
          org_u.email AS organizer_email,
          json_agg(
            json_build_object(
              'field_id', bs.field_id,
              'field_name', f.name,
              'slot_date', TO_CHAR(bs.slot_date, 'YYYY-MM-DD'),
              'start_time', bs.start_time
            ) ORDER BY bs.slot_date, bs.start_time
          ) AS slots
        FROM booking_slots bs
        JOIN fields f ON bs.field_id = f.field_id
        JOIN turfs t ON f.turf_id = t.turf_id
        LEFT JOIN areas a ON t.area_id = a.area_id
        JOIN users org_u ON t.organizer_id = org_u.user_id
        WHERE bs.booking_id = b.booking_id
        GROUP BY t.turf_id, a.name, a.city, org_u.user_id
        LIMIT 1
      ) t_info ON TRUE
      ${whereClause}
    `;

    const countSql = `SELECT COUNT(*) AS total ${baseFromSql}`;
    const countRes = await db.query(countSql, params);
    const total = parseInt(countRes.rows[0].total, 10);

    params.push(Number(limit));
    const limitIdx = params.length;
    params.push(Number(offset));
    const offsetIdx = params.length;

    const dataSql = `
      SELECT
        b.booking_id,
        b.status,
        b.total_amount,
        b.payment_method,
        b.advance_amount,
        b.cash_balance,
        b.cancel_reason,
        b.created_at,
        u.user_id AS customer_id,
        u.name AS customer_name,
        u.email AS customer_email,
        u.phone AS customer_phone,
        t_info.turf_id,
        t_info.turf_name,
        t_info.area_name,
        t_info.city,
        t_info.organizer_id,
        t_info.organizer_name,
        t_info.organizer_phone,
        t_info.organizer_email,
        COALESCE(t_info.slots, '[]'::json) AS slots,
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'payment_id', p.payment_id,
              'amount', p.amount,
              'status', p.status,
              'purpose', p.purpose,
              'method', p.method,
              'is_advance', p.is_advance,
              'created_at', p.created_at
            )
          ) FROM payments p WHERE p.booking_id = b.booking_id
        ), '[]'::json) AS payments
      ${baseFromSql}
      ORDER BY b.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const { rows } = await db.query(dataSql, params);

    return res.json({
      total,
      limit: Number(limit),
      offset: Number(offset),
      bookings: rows,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/admin/bookings/:id/status
 * Admin override to change booking status (confirm, complete, cancel with reason)
 */
async function updateBookingStatus(req, res) {
  const { id } = req.params;
  const { status, cancel_reason } = req.body;

  const validStatuses = ['pending', 'advance_paid', 'confirmed', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const updated = await db.withTransaction(async (client) => {
      const check = await client.query('SELECT booking_id, status FROM bookings WHERE booking_id = $1 FOR UPDATE', [id]);
      if (!check.rows.length) throw new Error('Booking not found.');

      if (status === 'cancelled') {
        const reason = (cancel_reason || '').trim() || 'Cancelled by administration';
        const { rows } = await client.query(
          `UPDATE bookings 
           SET status = 'cancelled', 
               cancel_reason = $1, 
               cancelled_at = NOW(), 
               updated_at = NOW() 
           WHERE booking_id = $2 
           RETURNING *`,
          [reason, id]
        );
        return rows[0];
      } else {
        const { rows } = await client.query(
          `UPDATE bookings 
           SET status = $1, 
               cancel_reason = CASE WHEN $1 <> 'cancelled' THEN NULL ELSE cancel_reason END,
               updated_at = NOW() 
           WHERE booking_id = $2 
           RETURNING *`,
          [status, id]
        );
        return rows[0];
      }
    });

    await logAdminAction(req.user.user_id, 'BOOKING_STATUS_UPDATE', 'booking', id, { status, cancel_reason }, req);

    return res.json({
      message: `Booking #${id} status updated to "${status}".`,
      booking: updated,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * GET /api/admin/orders
 * Paginated and filterable global marketplace orders list for platform administrators
 */
async function listAllOrders(req, res) {
  const { search, status, limit = 25, offset = 0 } = req.query;

  try {
    const conditions = [];
    const params = [];

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`o.status = $${params.length}`);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      params.push(term);
      const termIdx = params.length;

      let searchCond = `(u.name ILIKE $${termIdx} OR u.email ILIKE $${termIdx} OR u.phone ILIKE $${termIdx} OR o.delivery_address ILIKE $${termIdx} OR EXISTS (
        SELECT 1 FROM order_items oi_s
        JOIN products p_s ON oi_s.product_id = p_s.product_id
        LEFT JOIN sellers s_s ON p_s.seller_id = s_s.user_id
        WHERE oi_s.order_id = o.order_id AND (p_s.title ILIKE $${termIdx} OR s_s.shop_name ILIKE $${termIdx})
      ))`;
      if (!isNaN(Number(search.trim()))) {
        params.push(Number(search.trim()));
        searchCond += ` OR o.order_id = $${params.length}`;
      }
      conditions.push(`(${searchCond})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) AS total
      FROM orders o
      JOIN users u ON o.customer_id = u.user_id
      ${whereClause}
    `;
    const countRes = await db.query(countSql, params);
    const total = parseInt(countRes.rows[0].total, 10);

    params.push(Number(limit));
    const limitIdx = params.length;
    params.push(Number(offset));
    const offsetIdx = params.length;

    const dataSql = `
      SELECT
        o.order_id,
        o.status,
        o.total_amount,
        o.payment_method,
        o.advance_amount,
        o.cash_balance,
        o.delivery_address,
        o.delivery_phone,
        o.created_at,
        u.user_id AS customer_id,
        u.name AS customer_name,
        u.email AS customer_email,
        u.phone AS customer_phone,
        COALESCE(
          json_agg(
            json_build_object(
              'product_id', p.product_id,
              'title', p.title,
              'category', p.category,
              'shop_name', s.shop_name,
              'seller_name', seller_u.name,
              'seller_phone', seller_u.phone,
              'qty', oi.qty,
              'unit_price', oi.unit_price,
              'status', oi.status
            )
          ) FILTER (WHERE oi.product_id IS NOT NULL), '[]'::json
        ) AS items,
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'payment_id', pay.payment_id,
              'amount', pay.amount,
              'status', pay.status,
              'purpose', pay.purpose,
              'method', pay.method,
              'is_advance', pay.is_advance,
              'created_at', pay.created_at
            )
          ) FROM payments pay WHERE pay.order_id = o.order_id
        ), '[]'::json) AS payments
      FROM orders o
      JOIN users u ON o.customer_id = u.user_id
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.product_id
      LEFT JOIN sellers s ON p.seller_id = s.user_id
      LEFT JOIN users seller_u ON s.user_id = seller_u.user_id
      ${whereClause}
      GROUP BY o.order_id, u.user_id
      ORDER BY o.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const { rows } = await db.query(dataSql, params);

    return res.json({
      total,
      limit: Number(limit),
      offset: Number(offset),
      orders: rows,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/admin/orders/:id/status
 * Admin override to change order status (confirmed, shipped, delivered, cancelled with stock restoration)
 */
async function updateAdminOrderStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['placed', 'advance_paid', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const updated = await db.withTransaction(async (client) => {
      const check = await client.query('SELECT order_id, status FROM orders WHERE order_id = $1 FOR UPDATE', [id]);
      if (!check.rows.length) throw new Error('Order not found.');
      const current = check.rows[0];

      // If cancelling and not already cancelled, restore inventory
      if (status === 'cancelled' && current.status !== 'cancelled') {
        const { rows: items } = await client.query(
          'SELECT product_id, qty FROM order_items WHERE order_id = $1',
          [id]
        );
        for (const item of items) {
          await client.query(
            'UPDATE products SET stock = stock + $1 WHERE product_id = $2',
            [item.qty, item.product_id]
          );
        }
      }

      // If moving from cancelled back to active, deduct stock if available
      if (current.status === 'cancelled' && status !== 'cancelled') {
        const { rows: items } = await client.query(
          'SELECT product_id, qty FROM order_items WHERE order_id = $1',
          [id]
        );
        for (const item of items) {
          await client.query(
            'UPDATE products SET stock = GREATEST(0, stock - $1) WHERE product_id = $2',
            [item.qty, item.product_id]
          );
        }
      }

      const { rows } = await client.query(
        'UPDATE orders SET status = $1, updated_at = NOW() WHERE order_id = $2 RETURNING *',
        [status, id]
      );
      await client.query(
        'UPDATE order_items SET status = $1 WHERE order_id = $2',
        [status, id]
      );

      return rows[0];
    });

    await logAdminAction(req.user.user_id, 'ORDER_STATUS_UPDATE', 'order', id, { status }, req);

    return res.json({
      message: `Order #${id} status updated to "${status}".`,
      order: updated,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * GET /api/admin/turfs
 * Comprehensive listing of all turf venues across Dhaka (Approved, Pending, Suspended)
 */
async function listAllTurfs(req, res) {
  const { search, status, active, limit = 25, offset = 0 } = req.query;

  try {
    const conditions = [];
    const params = [];

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`t.approval_status = $${params.length}`);
    }

    if (active && active !== 'all') {
      params.push(active === 'true' || active === true);
      conditions.push(`t.is_active = $${params.length}`);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      params.push(term);
      const termIdx = params.length;

      let searchCond = `(t.name ILIKE $${termIdx} OR t.address ILIKE $${termIdx} OR a.name ILIKE $${termIdx} OR u.name ILIKE $${termIdx} OR u.email ILIKE $${termIdx} OR u.phone ILIKE $${termIdx})`;
      if (!isNaN(Number(search.trim()))) {
        params.push(Number(search.trim()));
        searchCond += ` OR t.turf_id = $${params.length}`;
      }
      conditions.push(`(${searchCond})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) AS total
      FROM turfs t
      JOIN areas a ON t.area_id = a.area_id
      JOIN organizers o ON t.organizer_id = o.user_id
      JOIN users u ON o.user_id = u.user_id
      ${whereClause}
    `;
    const countRes = await db.query(countSql, params);
    const total = parseInt(countRes.rows[0].total, 10);

    params.push(Number(limit));
    const limitIdx = params.length;
    params.push(Number(offset));
    const offsetIdx = params.length;

    const dataSql = `
      SELECT
        t.turf_id,
        t.name,
        t.address,
        t.hourly_rate,
        t.rating,
        t.description,
        t.approval_status,
        t.rejection_reason,
        t.is_active,
        t.created_at,
        a.area_id,
        a.name AS area_name,
        a.city,
        u.user_id AS organizer_id,
        u.name AS organizer_name,
        u.email AS organizer_email,
        u.phone AS organizer_phone,
        o.trade_licence,
        (
          SELECT ti.url FROM turf_images ti
          WHERE ti.turf_id = t.turf_id AND ti.is_cover = TRUE
          LIMIT 1
        ) AS cover_image,
        (
          SELECT COUNT(*)::int FROM fields f WHERE f.turf_id = t.turf_id
        ) AS fields_count,
        (
          SELECT COUNT(DISTINCT b.booking_id)::int
          FROM bookings b
          JOIN booking_slots bs ON b.booking_id = bs.booking_id
          JOIN fields f ON bs.field_id = f.field_id
          WHERE f.turf_id = t.turf_id
        ) AS bookings_count
      FROM turfs t
      JOIN areas a ON t.area_id = a.area_id
      JOIN organizers o ON t.organizer_id = o.user_id
      JOIN users u ON o.user_id = u.user_id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const { rows } = await db.query(dataSql, params);

    return res.json({
      total,
      limit: Number(limit),
      offset: Number(offset),
      turfs: rows,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/admin/turfs/:id/status
 * Toggle active/suspended state or override approval status
 */
async function updateTurfStatus(req, res) {
  const { id } = req.params;
  const { is_active, approval_status, rejection_reason } = req.body;

  try {
    const check = await db.query('SELECT turf_id, name, is_active, approval_status FROM turfs WHERE turf_id = $1', [id]);
    if (!check.rows.length) return res.status(404).json({ error: 'Turf venue not found.' });

    const fields = [];
    const values = [];

    if (is_active !== undefined) {
      values.push(is_active === true || is_active === 'true');
      fields.push(`is_active = $${values.length}`);
    }

    if (approval_status !== undefined) {
      const validApprovals = ['pending', 'approved', 'rejected'];
      if (!validApprovals.includes(approval_status)) {
        return res.status(400).json({ error: `Invalid approval_status. Must be one of: ${validApprovals.join(', ')}` });
      }
      values.push(approval_status);
      fields.push(`approval_status = $${values.length}`);

      if (approval_status === 'approved') {
        fields.push(`rejection_reason = NULL`);
      } else if (approval_status === 'rejected') {
        values.push(rejection_reason || 'Listing rejected by administration');
        fields.push(`rejection_reason = $${values.length}`);
      }
    }

    if (!fields.length) {
      return res.status(400).json({ error: 'No status changes provided.' });
    }

    values.push(id);
    const sql = `UPDATE turfs SET ${fields.join(', ')}, updated_at = NOW() WHERE turf_id = $${values.length} RETURNING *`;
    const { rows } = await db.query(sql, values);

    await logAdminAction(req.user.user_id, 'TURF_STATUS_UPDATE', 'turf', id, req.body, req);

    return res.json({
      message: `Turf "${rows[0].name}" status updated successfully.`,
      turf: rows[0],
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * GET /api/admin/products
 * Comprehensive listing of all sports gear in marketplace (Approved, Pending, Delisted)
 */
async function listAllProducts(req, res) {
  const { search, status, category, active, limit = 25, offset = 0 } = req.query;

  try {
    const conditions = [];
    const params = [];

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`p.approval_status = $${params.length}`);
    }

    if (category && category !== 'all') {
      params.push(category);
      conditions.push(`p.category = $${params.length}`);
    }

    if (active && active !== 'all') {
      params.push(active === 'true' || active === true);
      conditions.push(`p.is_active = $${params.length}`);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      params.push(term);
      const termIdx = params.length;

      let searchCond = `(p.title ILIKE $${termIdx} OR p.category ILIKE $${termIdx} OR s.shop_name ILIKE $${termIdx} OR u.name ILIKE $${termIdx} OR u.email ILIKE $${termIdx})`;
      if (!isNaN(Number(search.trim()))) {
        params.push(Number(search.trim()));
        searchCond += ` OR p.product_id = $${params.length}`;
      }
      conditions.push(`(${searchCond})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) AS total
      FROM products p
      JOIN sellers s ON p.seller_id = s.user_id
      JOIN users u ON s.user_id = u.user_id
      ${whereClause}
    `;
    const countRes = await db.query(countSql, params);
    const total = parseInt(countRes.rows[0].total, 10);

    params.push(Number(limit));
    const limitIdx = params.length;
    params.push(Number(offset));
    const offsetIdx = params.length;

    const dataSql = `
      SELECT
        p.product_id,
        p.title,
        p.price,
        p.category,
        p.condition,
        p.stock,
        p.description,
        p.approval_status,
        p.rejection_reason,
        p.is_active,
        p.created_at,
        s.user_id AS seller_id,
        s.shop_name,
        u.name AS seller_name,
        u.email AS seller_email,
        u.phone AS seller_phone,
        (
          SELECT pi.url FROM product_images pi
          WHERE pi.product_id = p.product_id AND pi.is_cover = TRUE
          LIMIT 1
        ) AS cover_image,
        (
          SELECT COALESCE(SUM(oi.qty), 0)::int
          FROM order_items oi
          WHERE oi.product_id = p.product_id
        ) AS units_sold
      FROM products p
      JOIN sellers s ON p.seller_id = s.user_id
      JOIN users u ON s.user_id = u.user_id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const { rows } = await db.query(dataSql, params);

    return res.json({
      total,
      limit: Number(limit),
      offset: Number(offset),
      products: rows,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/admin/products/:id/status
 * Toggle product publish/delist state, stock correction, or override approval status
 */
async function updateProductStatus(req, res) {
  const { id } = req.params;
  const { is_active, stock, approval_status, rejection_reason } = req.body;

  try {
    const check = await db.query('SELECT product_id, title, is_active, stock, approval_status FROM products WHERE product_id = $1', [id]);
    if (!check.rows.length) return res.status(404).json({ error: 'Product not found.' });

    const fields = [];
    const values = [];

    if (is_active !== undefined) {
      values.push(is_active === true || is_active === 'true');
      fields.push(`is_active = $${values.length}`);
    }

    if (stock !== undefined) {
      const stockNum = parseInt(stock, 10);
      if (isNaN(stockNum) || stockNum < 0) {
        return res.status(400).json({ error: 'Stock must be a non-negative number.' });
      }
      values.push(stockNum);
      fields.push(`stock = $${values.length}`);
    }

    if (approval_status !== undefined) {
      const validApprovals = ['pending', 'approved', 'rejected'];
      if (!validApprovals.includes(approval_status)) {
        return res.status(400).json({ error: `Invalid approval_status. Must be one of: ${validApprovals.join(', ')}` });
      }
      values.push(approval_status);
      fields.push(`approval_status = $${values.length}`);

      if (approval_status === 'approved') {
        fields.push(`rejection_reason = NULL`);
      } else if (approval_status === 'rejected') {
        values.push(rejection_reason || 'Product rejected by administration');
        fields.push(`rejection_reason = $${values.length}`);
      }
    }

    if (!fields.length) {
      return res.status(400).json({ error: 'No status changes provided.' });
    }

    values.push(id);
    const sql = `UPDATE products SET ${fields.join(', ')}, updated_at = NOW() WHERE product_id = $${values.length} RETURNING *`;
    const { rows } = await db.query(sql, values);

    await logAdminAction(req.user.user_id, 'PRODUCT_STATUS_UPDATE', 'product', id, req.body, req);

    return res.json({
      message: `Product "${rows[0].title}" updated successfully.`,
      product: rows[0],
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * GET /api/admin/financials/summary
 * High-level financial analytics, revenue breakdown, and host/merchant payout ledgers
 */
async function getFinancialSummary(req, res) {
  try {
    const rateRes = await db.query(
      "SELECT setting_value FROM platform_settings WHERE setting_key = 'commission_rate'"
    );
    const commissionPercent = parseFloat(rateRes.rows[0]?.setting_value) || 8;
    const feeRatio = commissionPercent / 100;
    const payoutRatio = Math.max(0, 1 - feeRatio);

    const [summaryRes, orgPayouts, sellerPayouts] = await Promise.all([
      db.query(`
        SELECT
          COALESCE(SUM(amount), 0)::numeric AS total_inflow,
          COALESCE(SUM(CASE WHEN booking_id IS NOT NULL THEN amount ELSE 0 END), 0)::numeric AS turf_revenue,
          COALESCE(SUM(CASE WHEN order_id IS NOT NULL THEN amount ELSE 0 END), 0)::numeric AS gear_revenue,
          COALESCE(SUM(CASE WHEN method IN ('card', 'sandbox_card', 'sslcommerz', 'bkash', 'nagad') THEN amount ELSE 0 END), 0)::numeric AS online_revenue,
          COALESCE(SUM(CASE WHEN method = 'cash' THEN amount ELSE 0 END), 0)::numeric AS cash_revenue,
          COALESCE(SUM(CASE WHEN is_advance = TRUE THEN amount ELSE 0 END), 0)::numeric AS advance_collected,
          COALESCE(SUM(CASE WHEN status IN ('completed', 'success') THEN 1 ELSE 0 END), 0)::int AS total_successful_transactions,
          COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0)::int AS pending_transactions,
          COALESCE(SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END), 0)::int AS refunded_transactions,
          COALESCE(SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END), 0)::numeric AS refunded_amount
        FROM payments
        WHERE status IN ('completed', 'success')
      `),
      db.query(`
        SELECT
          u.user_id AS organizer_id,
          u.name AS organizer_name,
          u.email AS organizer_email,
          u.phone AS organizer_phone,
          o.trade_licence,
          o.payout_account,
          COUNT(DISTINCT b.booking_id)::int AS bookings_count,
          COALESCE(SUM(pay.amount), 0)::numeric AS gross_collected,
          ROUND(COALESCE(SUM(pay.amount), 0) * $1, 2)::numeric AS platform_fee,
          ROUND(COALESCE(SUM(pay.amount), 0) * $2, 2)::numeric AS net_payout
        FROM organizers o
        JOIN users u ON o.user_id = u.user_id
        LEFT JOIN turfs t ON o.user_id = t.organizer_id
        LEFT JOIN fields f ON t.turf_id = f.turf_id
        LEFT JOIN booking_slots bs ON f.field_id = bs.field_id
        LEFT JOIN bookings b ON bs.booking_id = b.booking_id
        LEFT JOIN payments pay ON b.booking_id = pay.booking_id AND pay.status IN ('completed', 'success')
        GROUP BY u.user_id, o.trade_licence, o.payout_account
        ORDER BY gross_collected DESC
        LIMIT 50
      `, [feeRatio, payoutRatio]),
      db.query(`
        SELECT
          u.user_id AS seller_id,
          s.shop_name,
          u.name AS seller_name,
          u.email AS seller_email,
          u.phone AS seller_phone,
          s.payout_account,
          COUNT(DISTINCT oi.order_id)::int AS orders_count,
          COALESCE(SUM(oi.qty * oi.unit_price), 0)::numeric AS gross_sales,
          ROUND(COALESCE(SUM(oi.qty * oi.unit_price), 0) * $1, 2)::numeric AS platform_fee,
          ROUND(COALESCE(SUM(oi.qty * oi.unit_price), 0) * $2, 2)::numeric AS net_payout
        FROM sellers s
        JOIN users u ON s.user_id = u.user_id
        LEFT JOIN products p ON s.user_id = p.seller_id
        LEFT JOIN order_items oi ON p.product_id = oi.product_id
        LEFT JOIN orders ord ON oi.order_id = ord.order_id AND ord.status != 'cancelled'
        GROUP BY u.user_id, s.shop_name, s.payout_account
        ORDER BY gross_sales DESC
        LIMIT 50
      `, [feeRatio, payoutRatio])
    ]);

    const stats = summaryRes.rows[0];
    const totalInflow = parseFloat(stats.total_inflow) || 0;
    const platformCommission = Math.round(totalInflow * feeRatio * 100) / 100;
    const payoutLiability = Math.round(totalInflow * payoutRatio * 100) / 100;

    return res.json({
      summary: {
        total_inflow: totalInflow,
        turf_revenue: parseFloat(stats.turf_revenue) || 0,
        gear_revenue: parseFloat(stats.gear_revenue) || 0,
        online_revenue: parseFloat(stats.online_revenue) || 0,
        cash_revenue: parseFloat(stats.cash_revenue) || 0,
        advance_collected: parseFloat(stats.advance_collected) || 0,
        platform_commission: platformCommission,
        payout_liability: payoutLiability,
        total_transactions: stats.total_successful_transactions,
        pending_transactions: stats.pending_transactions,
        refunded_transactions: stats.refunded_transactions,
        refunded_amount: parseFloat(stats.refunded_amount) || 0,
        commission_rate: `${commissionPercent}%`,
      },
      organizer_payouts: orgPayouts.rows,
      seller_payouts: sellerPayouts.rows,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/admin/financials/transactions
 * Detailed paginated and filterable transaction ledger
 */
async function listTransactions(req, res) {
  const {
    search,
    target, // 'all' | 'booking' | 'order'
    method, // 'all' | 'card' | 'sandbox_card' | 'cash'
    status, // 'all' | 'completed' | 'success' | 'pending' | 'failed' | 'refunded'
    purpose, // 'all' | 'full' | 'advance' | 'balance'
    limit = 25,
    offset = 0,
  } = req.query;

  try {
    const conditions = [];
    const params = [];

    if (target === 'booking') {
      conditions.push('p.booking_id IS NOT NULL');
    } else if (target === 'order') {
      conditions.push('p.order_id IS NOT NULL');
    }

    if (method && method !== 'all') {
      params.push(method);
      conditions.push(`p.method = $${params.length}`);
    }

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`p.status = $${params.length}`);
    }

    if (purpose && purpose !== 'all') {
      params.push(purpose);
      conditions.push(`p.purpose = $${params.length}`);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      params.push(term);
      const termIdx = params.length;

      let searchCond = `(
        cust.name ILIKE $${termIdx} OR
        cust.email ILIKE $${termIdx} OR
        cust.phone ILIKE $${termIdx} OR
        p.trx_id ILIKE $${termIdx} OR
        t.name ILIKE $${termIdx} OR
        org_u.name ILIKE $${termIdx} OR
        s.shop_name ILIKE $${termIdx} OR
        seller_u.name ILIKE $${termIdx}
      )`;

      if (!isNaN(Number(search.trim()))) {
        params.push(Number(search.trim()));
        searchCond += ` OR p.payment_id = $${params.length} OR p.booking_id = $${params.length} OR p.order_id = $${params.length}`;
      }
      conditions.push(`(${searchCond})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(DISTINCT p.payment_id) AS total
      FROM payments p
      LEFT JOIN bookings b ON p.booking_id = b.booking_id
      LEFT JOIN users cust ON COALESCE(b.customer_id, (SELECT o.customer_id FROM orders o WHERE o.order_id = p.order_id)) = cust.user_id
      LEFT JOIN (
        SELECT DISTINCT bs.booking_id, f.turf_id
        FROM booking_slots bs
        JOIN fields f ON bs.field_id = f.field_id
      ) b_turf ON b.booking_id = b_turf.booking_id
      LEFT JOIN turfs t ON b_turf.turf_id = t.turf_id
      LEFT JOIN organizers org ON t.organizer_id = org.user_id
      LEFT JOIN users org_u ON org.user_id = org_u.user_id
      LEFT JOIN orders ord ON p.order_id = ord.order_id
      LEFT JOIN order_items oi ON ord.order_id = oi.order_id
      LEFT JOIN products prod ON oi.product_id = prod.product_id
      LEFT JOIN sellers s ON prod.seller_id = s.user_id
      LEFT JOIN users seller_u ON s.user_id = seller_u.user_id
      ${whereClause}
    `;

    const countRes = await db.query(countSql, params);
    const total = parseInt(countRes.rows[0].total, 10);

    params.push(Number(limit));
    const limitIdx = params.length;
    params.push(Number(offset));
    const offsetIdx = params.length;

    const dataSql = `
      SELECT
        p.payment_id,
        p.booking_id,
        p.order_id,
        p.amount,
        p.purpose,
        p.method,
        p.trx_id,
        p.paid_at,
        p.status,
        p.is_advance,
        p.created_at,
        CASE
          WHEN p.booking_id IS NOT NULL THEN 'booking'
          WHEN p.order_id IS NOT NULL THEN 'order'
          ELSE 'other'
        END AS payment_target,
        cust.user_id AS customer_id,
        cust.name AS customer_name,
        cust.email AS customer_email,
        cust.phone AS customer_phone,
        t.turf_id,
        t.name AS turf_name,
        org_u.name AS organizer_name,
        org.payout_account AS organizer_payout,
        ord.order_id AS target_order_id,
        s.shop_name,
        seller_u.name AS seller_name,
        s.payout_account AS seller_payout,
        ROUND(p.amount * 0.08, 2)::numeric AS platform_fee,
        ROUND(p.amount * 0.92, 2)::numeric AS net_payout
      FROM payments p
      LEFT JOIN bookings b ON p.booking_id = b.booking_id
      LEFT JOIN users cust ON COALESCE(b.customer_id, (SELECT o.customer_id FROM orders o WHERE o.order_id = p.order_id)) = cust.user_id
      LEFT JOIN (
        SELECT DISTINCT bs.booking_id, f.turf_id
        FROM booking_slots bs
        JOIN fields f ON bs.field_id = f.field_id
      ) b_turf ON b.booking_id = b_turf.booking_id
      LEFT JOIN turfs t ON b_turf.turf_id = t.turf_id
      LEFT JOIN organizers org ON t.organizer_id = org.user_id
      LEFT JOIN users org_u ON org.user_id = org_u.user_id
      LEFT JOIN orders ord ON p.order_id = ord.order_id
      LEFT JOIN order_items oi ON ord.order_id = oi.order_id
      LEFT JOIN products prod ON oi.product_id = prod.product_id
      LEFT JOIN sellers s ON prod.seller_id = s.user_id
      LEFT JOIN users seller_u ON s.user_id = seller_u.user_id
      ${whereClause}
      GROUP BY
        p.payment_id,
        cust.user_id,
        t.turf_id,
        org_u.name,
        org.payout_account,
        ord.order_id,
        s.shop_name,
        seller_u.name,
        s.payout_account
      ORDER BY p.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const { rows } = await db.query(dataSql, params);

    return res.json({
      total,
      limit: Number(limit),
      offset: Number(offset),
      transactions: rows,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/admin/financials/transactions/:id/status
 * Administrative override for transaction status (completed, refunded, failed, pending)
 */
async function updateTransactionStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['completed', 'refunded', 'failed', 'pending'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const { rows } = await db.query(
      'UPDATE payments SET status = $1 WHERE payment_id = $2 RETURNING *',
      [status, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Transaction record not found.' });

    await logAdminAction(req.user.user_id, 'TRANSACTION_STATUS_UPDATE', 'transaction', id, { status }, req);

    return res.json({
      message: `Transaction #${id} status changed to "${status}".`,
      transaction: rows[0],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/admin/settings
 * Retrieve platform configurations
 */
async function getPlatformSettings(req, res) {
  try {
    const { rows } = await db.query(
      'SELECT setting_key, setting_value, description, updated_at FROM platform_settings ORDER BY setting_key ASC'
    );
    const settings = {};
    rows.forEach((row) => {
      settings[row.setting_key] = row.setting_value;
    });

    return res.json({
      settings,
      list: rows,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/admin/settings
 * Update platform configuration parameters
 */
async function updatePlatformSettings(req, res) {
  const allowedKeys = [
    'commission_rate',
    'advance_percentage',
    'broadcast_enabled',
    'broadcast_message',
    'broadcast_type',
    'maintenance_mode',
    'support_phone',
    'support_email',
  ];

  const updates = req.body;
  if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Request body must contain at least one setting key to update.' });
  }

  // Sanitize and validate
  for (const [key, val] of Object.entries(updates)) {
    if (!allowedKeys.includes(key)) {
      return res.status(400).json({ error: `Invalid setting key: "${key}".` });
    }

    if (key === 'commission_rate') {
      const num = parseFloat(val);
      if (isNaN(num) || num < 0 || num > 100) {
        return res.status(400).json({ error: 'commission_rate must be a number between 0 and 100.' });
      }
    }

    if (key === 'advance_percentage') {
      const num = parseFloat(val);
      if (isNaN(num) || num < 0 || num > 100) {
        return res.status(400).json({ error: 'advance_percentage must be a number between 0 and 100.' });
      }
    }

    if (key === 'broadcast_type') {
      const validTypes = ['info', 'warning', 'success', 'alert'];
      if (!validTypes.includes(val)) {
        return res.status(400).json({ error: `broadcast_type must be one of: ${validTypes.join(', ')}.` });
      }
    }

    if (key === 'broadcast_enabled' || key === 'maintenance_mode') {
      if (typeof val === 'boolean') {
        updates[key] = val ? 'true' : 'false';
      } else if (val !== 'true' && val !== 'false') {
        return res.status(400).json({ error: `${key} must be "true" or "false" (or boolean).` });
      }
    }
  }

  try {
    await db.withTransaction(async (client) => {
      for (const [key, val] of Object.entries(updates)) {
        await client.query(
          'UPDATE platform_settings SET setting_value = $1, updated_at = NOW() WHERE setting_key = $2',
          [String(val), key]
        );
      }
    });

    const { rows } = await db.query(
      'SELECT setting_key, setting_value, description, updated_at FROM platform_settings ORDER BY setting_key ASC'
    );
    const settings = {};
    rows.forEach((row) => {
      settings[row.setting_key] = row.setting_value;
    });

    await logAdminAction(req.user.user_id, 'SETTINGS_UPDATE', 'setting', null, updates, req);

    return res.json({
      message: 'Platform settings updated successfully.',
      settings,
      list: rows,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/admin/audit-logs
 * List chronological admin audit trail
 */
async function listAuditLogs(req, res) {
  const { search, action, target_type, limit = 25, offset = 0 } = req.query;

  try {
    const conditions = [];
    const params = [];

    if (action && action !== 'all') {
      params.push(action);
      conditions.push(`l.action = $${params.length}`);
    }

    if (target_type && target_type !== 'all') {
      params.push(target_type);
      conditions.push(`l.target_type = $${params.length}`);
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      const sIdx = params.length;
      conditions.push(`(
        u.name ILIKE $${sIdx} OR
        u.email ILIKE $${sIdx} OR
        l.target_id ILIKE $${sIdx} OR
        l.details::text ILIKE $${sIdx}
      )`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query(
      `SELECT COUNT(*)::int AS total
       FROM admin_audit_logs l
       JOIN users u ON l.admin_id = u.user_id
       ${whereClause}`,
      params
    );
    const total = countRes.rows[0]?.total || 0;

    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;
    params.push(Number(limit), Number(offset));

    const dataRes = await db.query(
      `SELECT
         l.log_id,
         l.admin_id,
         u.name AS admin_name,
         u.email AS admin_email,
         l.action,
         l.target_type,
         l.target_id,
         l.details,
         l.ip_address,
         l.created_at
       FROM admin_audit_logs l
       JOIN users u ON l.admin_id = u.user_id
       ${whereClause}
       ORDER BY l.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    );

    return res.json({
      total,
      limit: Number(limit),
      offset: Number(offset),
      logs: dataRes.rows,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/admin/reviews
 * Moderate turf and product reviews
 */
async function listReviews(req, res) {
  const { type = 'all', rating, search, limit = 25, offset = 0 } = req.query;

  try {
    const params = [];
    const turfConditions = [];
    const prodConditions = [];

    if (rating && rating !== 'all') {
      params.push(Number(rating));
      turfConditions.push(`tr.rating = $${params.length}`);
      prodConditions.push(`pr.rating = $${params.length}`);
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      const sIdx = params.length;
      turfConditions.push(`(u.name ILIKE $${sIdx} OR t.name ILIKE $${sIdx} OR tr.comment ILIKE $${sIdx})`);
      prodConditions.push(`(u.name ILIKE $${sIdx} OR p.title ILIKE $${sIdx} OR pr.comment ILIKE $${sIdx})`);
    }

    const turfWhere = turfConditions.length ? `WHERE ${turfConditions.join(' AND ')}` : '';
    const prodWhere = prodConditions.length ? `WHERE ${prodConditions.join(' AND ')}` : '';

    let unionQuery = '';
    if (type === 'turf') {
      unionQuery = `
        SELECT
          'turf' AS review_type,
          tr.review_id,
          tr.booking_id,
          NULL::int AS order_id,
          t.turf_id AS target_id,
          t.name AS target_name,
          u.user_id AS customer_id,
          u.name AS customer_name,
          u.email AS customer_email,
          tr.rating,
          tr.comment,
          tr.created_at
        FROM turf_reviews tr
        JOIN bookings b ON tr.booking_id = b.booking_id
        JOIN customers c ON b.customer_id = c.user_id
        JOIN users u ON c.user_id = u.user_id
        JOIN booking_slots bs ON b.booking_id = bs.booking_id
        JOIN fields f ON bs.field_id = f.field_id
        JOIN turfs t ON f.turf_id = t.turf_id
        ${turfWhere}
        GROUP BY tr.review_id, tr.booking_id, t.turf_id, t.name, u.user_id, u.name, u.email, tr.rating, tr.comment, tr.created_at
      `;
    } else if (type === 'product') {
      unionQuery = `
        SELECT
          'product' AS review_type,
          pr.review_id,
          NULL::int AS booking_id,
          pr.order_id,
          p.product_id AS target_id,
          p.title AS target_name,
          u.user_id AS customer_id,
          u.name AS customer_name,
          u.email AS customer_email,
          pr.rating,
          pr.comment,
          pr.created_at
        FROM product_reviews pr
        JOIN orders ord ON pr.order_id = ord.order_id
        JOIN customers c ON ord.customer_id = c.user_id
        JOIN users u ON c.user_id = u.user_id
        JOIN products p ON pr.product_id = p.product_id
        ${prodWhere}
      `;
    } else {
      unionQuery = `
        SELECT
          'turf' AS review_type,
          tr.review_id,
          tr.booking_id,
          NULL::int AS order_id,
          t.turf_id AS target_id,
          t.name AS target_name,
          u.user_id AS customer_id,
          u.name AS customer_name,
          u.email AS customer_email,
          tr.rating,
          tr.comment,
          tr.created_at
        FROM turf_reviews tr
        JOIN bookings b ON tr.booking_id = b.booking_id
        JOIN customers c ON b.customer_id = c.user_id
        JOIN users u ON c.user_id = u.user_id
        JOIN booking_slots bs ON b.booking_id = bs.booking_id
        JOIN fields f ON bs.field_id = f.field_id
        JOIN turfs t ON f.turf_id = t.turf_id
        ${turfWhere}
        GROUP BY tr.review_id, tr.booking_id, t.turf_id, t.name, u.user_id, u.name, u.email, tr.rating, tr.comment, tr.created_at

        UNION ALL

        SELECT
          'product' AS review_type,
          pr.review_id,
          NULL::int AS booking_id,
          pr.order_id,
          p.product_id AS target_id,
          p.title AS target_name,
          u.user_id AS customer_id,
          u.name AS customer_name,
          u.email AS customer_email,
          pr.rating,
          pr.comment,
          pr.created_at
        FROM product_reviews pr
        JOIN orders ord ON pr.order_id = ord.order_id
        JOIN customers c ON ord.customer_id = c.user_id
        JOIN users u ON c.user_id = u.user_id
        JOIN products p ON pr.product_id = p.product_id
        ${prodWhere}
      `;
    }

    const countRes = await db.query(`SELECT COUNT(*)::int AS total FROM (${unionQuery}) sub`, params);
    const total = countRes.rows[0]?.total || 0;

    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;
    params.push(Number(limit), Number(offset));

    const dataRes = await db.query(
      `SELECT * FROM (${unionQuery}) sub ORDER BY created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    );

    return res.json({
      total,
      limit: Number(limit),
      offset: Number(offset),
      reviews: dataRes.rows,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /api/admin/reviews/:type/:id
 * Delete flagged review and recompute aggregate ratings
 */
async function deleteReview(req, res) {
  const { type, id } = req.params;

  try {
    if (type === 'turf') {
      const { rows } = await db.query('DELETE FROM turf_reviews WHERE review_id = $1 RETURNING *', [id]);
      if (!rows.length) return res.status(404).json({ error: 'Turf review not found.' });

      await logAdminAction(req.user.user_id, 'REVIEW_DELETE', 'turf_review', id, { review: rows[0] }, req);
      return res.json({ message: 'Turf review deleted successfully.' });
    } else if (type === 'product') {
      const { rows } = await db.query('DELETE FROM product_reviews WHERE review_id = $1 RETURNING *', [id]);
      if (!rows.length) return res.status(404).json({ error: 'Product review not found.' });

      await logAdminAction(req.user.user_id, 'REVIEW_DELETE', 'product_review', id, { review: rows[0] }, req);
      return res.json({ message: 'Product review deleted successfully.' });
    } else {
      return res.status(400).json({ error: 'Invalid review type. Must be "turf" or "product".' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/admin/areas
 * List coverage zones with active turf count
 */
async function listAreas(req, res) {
  try {
    const { rows } = await db.query(`
      SELECT
        a.area_id,
        a.name,
        a.city,
        a.center_lat,
        a.center_lng,
        COUNT(t.turf_id)::int AS turfs_count
      FROM areas a
      LEFT JOIN turfs t ON a.area_id = t.area_id
      GROUP BY a.area_id
      ORDER BY a.name ASC
    `);

    return res.json({ areas: rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/admin/areas
 * Create a new coverage zone
 */
async function createArea(req, res) {
  const { name, city = 'Dhaka', center_lat, center_lng } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Area name is required.' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO areas (name, city, center_lat, center_lng)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name.trim(), (city || 'Dhaka').trim(), center_lat ? parseFloat(center_lat) : null, center_lng ? parseFloat(center_lng) : null]
    );

    await logAdminAction(req.user.user_id, 'AREA_CREATE', 'area', rows[0].area_id, { area: rows[0] }, req);
    return res.status(201).json({ message: 'Coverage area created successfully.', area: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'An area with this name already exists.' });
    }
    return res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/admin/areas/:id
 * Update coverage zone details
 */
async function updateArea(req, res) {
  const { id } = req.params;
  const { name, city, center_lat, center_lng } = req.body;

  try {
    const { rows } = await db.query(
      `UPDATE areas
       SET name = COALESCE($1, name),
           city = COALESCE($2, city),
           center_lat = COALESCE($3, center_lat),
           center_lng = COALESCE($4, center_lng)
       WHERE area_id = $5
       RETURNING *`,
      [
        name ? name.trim() : null,
        city ? city.trim() : null,
        center_lat !== undefined ? (center_lat ? parseFloat(center_lat) : null) : null,
        center_lng !== undefined ? (center_lng ? parseFloat(center_lng) : null) : null,
        id,
      ]
    );

    if (!rows.length) return res.status(404).json({ error: 'Coverage area not found.' });

    await logAdminAction(req.user.user_id, 'AREA_UPDATE', 'area', id, req.body, req);
    return res.json({ message: 'Area updated successfully.', area: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'An area with this name already exists.' });
    }
    return res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /api/admin/areas/:id
 * Delete coverage zone if unreferenced
 */
async function deleteArea(req, res) {
  const { id } = req.params;

  try {
    const turfCheck = await db.query('SELECT COUNT(*)::int AS count FROM turfs WHERE area_id = $1', [id]);
    if (turfCheck.rows[0]?.count > 0) {
      return res.status(400).json({
        error: `Cannot delete area. It is assigned to ${turfCheck.rows[0].count} active turf arena(s). Reassign or delete those arenas first.`,
      });
    }

    const { rows } = await db.query('DELETE FROM areas WHERE area_id = $1 RETURNING *', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Coverage area not found.' });

    await logAdminAction(req.user.user_id, 'AREA_DELETE', 'area', id, { area: rows[0] }, req);
    return res.json({ message: 'Coverage area deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getStats,
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  listPendingOrganizers,
  listPendingSellers,
  listPendingTurfs,
  listPendingProducts,
  approveOrganizer,
  rejectOrganizer,
  approveSeller,
  rejectSeller,
  approveTurf,
  rejectTurf,
  approveProduct,
  rejectProduct,
  deleteTurf,
  deleteProduct,
  listAllBookings,
  updateBookingStatus,
  listAllOrders,
  updateAdminOrderStatus,
  listAllTurfs,
  updateTurfStatus,
  listAllProducts,
  updateProductStatus,
  getFinancialSummary,
  listTransactions,
  updateTransactionStatus,
  getPlatformSettings,
  updatePlatformSettings,
  listAuditLogs,
  listReviews,
  deleteReview,
  listAreas,
  createArea,
  updateArea,
  deleteArea,
};


