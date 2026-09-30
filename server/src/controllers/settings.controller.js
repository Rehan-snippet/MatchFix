const db = require('../config/db');

/**
 * GET /api/settings/public
 * Public system settings accessible by any client application
 */
async function getPublicSettings(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT setting_key, setting_value FROM platform_settings
       WHERE setting_key IN (
         'commission_rate',
         'advance_percentage',
         'broadcast_enabled',
         'broadcast_message',
         'broadcast_type',
         'maintenance_mode',
         'support_phone',
         'support_email'
       )`
    );

    const settings = {
      commission_rate: 8,
      advance_percentage: 20,
      broadcast_enabled: false,
      broadcast_message: '',
      broadcast_type: 'info',
      maintenance_mode: false,
      support_phone: '',
      support_email: '',
    };

    rows.forEach((r) => {
      if (r.setting_key === 'commission_rate' || r.setting_key === 'advance_percentage') {
        settings[r.setting_key] = parseFloat(r.setting_value) || 0;
      } else if (r.setting_key === 'broadcast_enabled' || r.setting_key === 'maintenance_mode') {
        settings[r.setting_key] = r.setting_value === 'true';
      } else {
        settings[r.setting_key] = r.setting_value;
      }
    });

    return res.json(settings);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getPublicSettings,
};
