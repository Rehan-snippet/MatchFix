const db = require('../config/db');

/**
 * GET /api/fields
 */
async function listFields(req, res) {
  const { turf_id } = req.query;

  try {
    let queryText = `
      SELECT f.*, t.name AS turf_name, t.organizer_id
      FROM fields f
      JOIN turfs t ON f.turf_id = t.turf_id
    `;
    const params = [];

    if (turf_id) {
      params.push(turf_id);
      queryText += ` WHERE f.turf_id = $1`;
    }

    queryText += ` ORDER BY f.field_id ASC`;

    const { rows } = await db.query(queryText, params);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/fields/:id
 */
async function getField(req, res) {
  const { id } = req.params;
  try {
    const { rows } = await db.query(
      `SELECT f.*, t.name as turf_name, t.organizer_id,
        (
          SELECT json_agg(json_build_object(
            'rule_id', pr.rule_id,
            'day_of_week', pr.day_of_week,
            'start_time', pr.start_time,
            'end_time', pr.end_time,
            'hourly_rate', pr.hourly_rate
          ))
          FROM pricing_rules pr WHERE pr.field_id = f.field_id
        ) AS pricing_rules
       FROM fields f
       JOIN turfs t ON f.turf_id = t.turf_id
       WHERE f.field_id = $1`,
      [id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Field not found.' });
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/fields
 * DML 13: Uses withTransaction
 */
async function createField(req, res) {
  const { turf_id, name, side_type = '5v5', surface = 'Artificial Turf' } = req.body;

  if (!turf_id || !name) {
    return res.status(400).json({ error: 'turf_id and field name are required.' });
  }

  try {
    const field = await db.withTransaction(async (client) => {
      const turf = await client.query('SELECT organizer_id FROM turfs WHERE turf_id = $1', [turf_id]);
      if (!turf.rows.length) throw new Error('Turf not found.');
      if (turf.rows[0].organizer_id !== req.user.user_id) throw new Error('Unauthorized.');

      const { rows } = await client.query(
        `INSERT INTO fields (turf_id, name, side_type, surface)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [turf_id, name, side_type, surface]
      );
      return rows[0];
    });

    return res.status(201).json(field);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * PUT /api/fields/:id
 * DML 14: Uses withTransaction
 */
async function updateField(req, res) {
  const { id } = req.params;
  const { name, side_type, surface } = req.body;

  try {
    const field = await db.withTransaction(async (client) => {
      const check = await client.query(
        `SELECT t.organizer_id FROM fields f JOIN turfs t ON f.turf_id = t.turf_id WHERE f.field_id = $1 FOR UPDATE`,
        [id]
      );
      if (!check.rows.length) throw new Error('Field not found.');
      if (check.rows[0].organizer_id !== req.user.user_id) throw new Error('Unauthorized.');

      const { rows } = await client.query(
        `UPDATE fields
         SET name = COALESCE($1, name),
             side_type = COALESCE($2, side_type),
             surface = COALESCE($3, surface)
         WHERE field_id = $4
         RETURNING *`,
        [name, side_type, surface, id]
      );
      return rows[0];
    });

    return res.json(field);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * DELETE /api/fields/:id
 * DML 15: Uses withTransaction
 */
async function deleteField(req, res) {
  const { id } = req.params;

  try {
    await db.withTransaction(async (client) => {
      const check = await client.query(
        `SELECT t.organizer_id FROM fields f JOIN turfs t ON f.turf_id = t.turf_id WHERE f.field_id = $1 FOR UPDATE`,
        [id]
      );
      if (!check.rows.length) throw new Error('Field not found.');
      if (check.rows[0].organizer_id !== req.user.user_id) throw new Error('Unauthorized.');

      await client.query('DELETE FROM fields WHERE field_id = $1', [id]);
    });

    return res.json({ message: 'Field deleted successfully.' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * POST /api/fields/:id/pricing-rules
 * DML 16: Uses withTransaction (Trigger trg_log_price_history logs to price_history)
 */
async function addPricingRule(req, res) {
  const { id } = req.params;
  const { day_of_week, start_time, end_time, hourly_rate } = req.body;

  if (day_of_week === undefined || !start_time || !end_time || !hourly_rate) {
    return res.status(400).json({ error: 'day_of_week, start_time, end_time, and hourly_rate are required.' });
  }

  try {
    const rule = await db.withTransaction(async (client) => {
      const check = await client.query(
        `SELECT t.organizer_id FROM fields f JOIN turfs t ON f.turf_id = t.turf_id WHERE f.field_id = $1`,
        [id]
      );
      if (!check.rows.length) throw new Error('Field not found.');
      if (check.rows[0].organizer_id !== req.user.user_id) throw new Error('Unauthorized.');

      const { rows } = await client.query(
        `INSERT INTO pricing_rules (field_id, day_of_week, start_time, end_time, hourly_rate)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [id, day_of_week, start_time, end_time, hourly_rate]
      );
      return rows[0];
    });

    return res.status(201).json(rule);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * PATCH /api/fields/:fieldId/pricing-rules/:ruleId
 * DML 17: Uses withTransaction
 */
async function updatePricingRule(req, res) {
  const { fieldId, ruleId } = req.params;
  const { hourly_rate } = req.body;

  if (!hourly_rate || Number(hourly_rate) <= 0) {
    return res.status(400).json({ error: 'A positive hourly_rate is required.' });
  }

  try {
    const updated = await db.withTransaction(async (client) => {
      const check = await client.query(
        `SELECT t.organizer_id FROM pricing_rules pr
         JOIN fields f ON pr.field_id = f.field_id
         JOIN turfs t ON f.turf_id = t.turf_id
         WHERE pr.rule_id = $1 AND pr.field_id = $2 FOR UPDATE`,
        [ruleId, fieldId]
      );
      if (!check.rows.length) throw new Error('Pricing rule not found.');
      if (check.rows[0].organizer_id !== req.user.user_id) throw new Error('Unauthorized.');

      const { rows } = await client.query(
        `UPDATE pricing_rules SET hourly_rate = $1 WHERE rule_id = $2 RETURNING *`,
        [hourly_rate, ruleId]
      );
      return rows[0];
    });

    return res.json({ rule: updated, message: 'Pricing rule updated successfully.' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * DELETE /api/fields/:fieldId/pricing-rules/:ruleId
 * DML 18: Uses withTransaction
 */
async function deletePricingRule(req, res) {
  const { fieldId, ruleId } = req.params;

  try {
    await db.withTransaction(async (client) => {
      const check = await client.query(
        `SELECT t.organizer_id FROM pricing_rules pr
         JOIN fields f ON pr.field_id = f.field_id
         JOIN turfs t ON f.turf_id = t.turf_id
         WHERE pr.rule_id = $1 AND pr.field_id = $2 FOR UPDATE`,
        [ruleId, fieldId]
      );
      if (!check.rows.length) throw new Error('Pricing rule not found.');
      if (check.rows[0].organizer_id !== req.user.user_id) throw new Error('Unauthorized.');

      await client.query('DELETE FROM pricing_rules WHERE rule_id = $1', [ruleId]);
    });

    return res.json({ message: 'Pricing rule deleted successfully.' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * GET /api/fields/:id/price-history
 */
async function getPriceHistory(req, res) {
  const { id } = req.params;

  try {
    const { rows } = await db.query(
      `SELECT ph.*, pr.day_of_week, pr.start_time, pr.end_time
       FROM price_history ph
       LEFT JOIN pricing_rules pr ON ph.rule_id = pr.rule_id
       WHERE ph.field_id = $1
       ORDER BY ph.changed_at DESC`,
      [id]
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  listFields,
  getField,
  createField,
  updateField,
  deleteField,
  addPricingRule,
  updatePricingRule,
  deletePricingRule,
  getPriceHistory,
};