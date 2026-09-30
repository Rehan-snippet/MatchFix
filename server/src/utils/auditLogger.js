const db = require('../config/db');

/**
 * Log an administrative action to the audit trail
 * @param {number} adminId - ID of admin performing action
 * @param {string} action - Descriptive action key (e.g. 'USER_UPDATE', 'TURF_APPROVE', 'ORDER_STATUS_UPDATE')
 * @param {string} targetType - Type of entity acted on ('user', 'turf', 'product', 'booking', 'order', 'transaction', 'setting', 'review', 'area')
 * @param {string|number|null} targetId - Identifier of target entity
 * @param {object} details - Additional metadata or payload snapshot
 * @param {object|null} req - Express request object for IP address
 */
async function logAdminAction(adminId, action, targetType, targetId, details = {}, req = null) {
  try {
    const rawIp = req
      ? req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1'
      : '127.0.0.1';
    const ip = String(rawIp).split(',')[0].trim().substring(0, 45);

    await db.query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        adminId,
        action,
        targetType,
        targetId ? String(targetId) : null,
        JSON.stringify(details || {}),
        ip,
      ]
    );
  } catch (err) {
    // Non-blocking: audit log failure should not crash primary operations
    console.error('Audit logging error (non-fatal):', err.message);
  }
}

module.exports = {
  logAdminAction,
};
