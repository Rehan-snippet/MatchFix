const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { assertOwnsTurf } = require('./turfs.controller');

// GET /api/fields?turf_id=1
const listFields = asyncHandler(async (req, res) => {
  const { turf_id } = req.query;
  if (!turf_id) throw new ApiError(400, 'turf_id query param is required');
  const { rows } = await db.query('SELECT * FROM fields WHERE turf_id = $1 ORDER BY field_id', [turf_id]);
  res.json(rows);
});

// GET /api/fields/:id  (+ pricing rules)
const getField = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM fields WHERE field_id = $1', [req.params.id]);
  if (!rows[0]) throw new ApiError(404, 'Field not found');
  const pricing = await db.query(
    'SELECT * FROM pricing_rules WHERE field_id = $1 ORDER BY day_of_week, start_time',
    [req.params.id]
  );
  res.json({ ...rows[0], pricing_rules: pricing.rows });
});

async function assertOwnsField(fieldId, organizerId) {
  const { rows } = await db.query(
    `SELECT f.*, t.organizer_id FROM fields f JOIN turfs t ON t.turf_id = f.turf_id WHERE f.field_id = $1`,
    [fieldId]
  );
  if (!rows[0]) throw new ApiError(404, 'Field not found');
  if (rows[0].organizer_id !== organizerId) throw new ApiError(403, 'You do not own this field');
  return rows[0];
}

// POST /api/fields  (organizer) { turf_id, name, side_type, surface }
const createField = asyncHandler(async (req, res) => {
  const { turf_id, name, side_type, surface } = req.body;
  if (!turf_id || !name || !side_type) throw new ApiError(400, 'turf_id, name and side_type are required');
  await assertOwnsTurf(turf_id, req.user.user_id);

  const { rows } = await db.query(
    `INSERT INTO fields (turf_id, name, side_type, surface) VALUES ($1,$2,$3,$4) RETURNING *`,
    [turf_id, name, side_type, surface || null]
  );
  res.status(201).json(rows[0]);
});

// PATCH /api/fields/:id
const updateField = asyncHandler(async (req, res) => {
  await assertOwnsField(req.params.id, req.user.user_id);
  const { name, side_type, surface } = req.body;
  const { rows } = await db.query(
    `UPDATE fields SET name = COALESCE($1,name), side_type = COALESCE($2,side_type), surface = COALESCE($3,surface)
     WHERE field_id = $4 RETURNING *`,
    [name, side_type, surface, req.params.id]
  );
  res.json(rows[0]);
});

// DELETE /api/fields/:id
const deleteField = asyncHandler(async (req, res) => {
  await assertOwnsField(req.params.id, req.user.user_id);
  await db.query('DELETE FROM fields WHERE field_id = $1', [req.params.id]);
  res.status(204).send();
});

// POST /api/fields/:id/pricing-rules  { day_of_week, start_time, end_time, hourly_rate, effective_from }
const addPricingRule = asyncHandler(async (req, res) => {
  await assertOwnsField(req.params.id, req.user.user_id);
  const { day_of_week, start_time, end_time, hourly_rate, effective_from } = req.body;
  if (day_of_week === undefined || !start_time || !end_time || hourly_rate === undefined) {
    throw new ApiError(400, 'day_of_week, start_time, end_time and hourly_rate are required');
  }
  const { rows } = await db.query(
    `INSERT INTO pricing_rules (field_id, day_of_week, start_time, end_time, hourly_rate, effective_from)
     VALUES ($1,$2,$3,$4,$5, COALESCE($6, CURRENT_DATE)) RETURNING *`,
    [req.params.id, day_of_week, start_time, end_time, hourly_rate, effective_from || null]
  );
  res.status(201).json(rows[0]);
});

// PATCH /api/fields/:fieldId/pricing-rules/:ruleId  { hourly_rate, ... }
// Every rate change is written to price_history ("logs") by the owning
// organizer ("edits") inside a single transaction.
const updatePricingRule = asyncHandler(async (req, res) => {
  const field = await assertOwnsField(req.params.fieldId, req.user.user_id);
  const { hourly_rate, day_of_week, start_time, end_time, effective_from } = req.body;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const current = await client.query('SELECT * FROM pricing_rules WHERE rule_id = $1 AND field_id = $2', [
      req.params.ruleId,
      req.params.fieldId,
    ]);
    if (!current.rows[0]) throw new ApiError(404, 'Pricing rule not found');
    const oldRate = current.rows[0].hourly_rate;

    const { rows } = await client.query(
      `UPDATE pricing_rules SET
         hourly_rate = COALESCE($1, hourly_rate),
         day_of_week = COALESCE($2, day_of_week),
         start_time = COALESCE($3, start_time),
         end_time = COALESCE($4, end_time),
         effective_from = COALESCE($5, effective_from)
       WHERE rule_id = $6 RETURNING *`,
      [hourly_rate, day_of_week, start_time, end_time, effective_from, req.params.ruleId]
    );

    if (hourly_rate !== undefined && Number(hourly_rate) !== Number(oldRate)) {
      await client.query(
        `INSERT INTO price_history (rule_id, organizer_id, old_rate, new_rate) VALUES ($1,$2,$3,$4)`,
        [req.params.ruleId, field.organizer_id, oldRate, hourly_rate]
      );
    }

    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// DELETE /api/fields/:fieldId/pricing-rules/:ruleId
const deletePricingRule = asyncHandler(async (req, res) => {
  await assertOwnsField(req.params.fieldId, req.user.user_id);
  const { rowCount } = await db.query(
    'DELETE FROM pricing_rules WHERE rule_id = $1 AND field_id = $2',
    [req.params.ruleId, req.params.fieldId]
  );
  if (!rowCount) throw new ApiError(404, 'Pricing rule not found');
  res.status(204).send();
});

// GET /api/fields/:fieldId/pricing-rules/:ruleId/history
const getPriceHistory = asyncHandler(async (req, res) => {
  await assertOwnsField(req.params.fieldId, req.user.user_id);
  const { rows } = await db.query(
    'SELECT * FROM price_history WHERE rule_id = $1 ORDER BY changed_at DESC',
    [req.params.ruleId]
  );
  res.json(rows);
});

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
  assertOwnsField,
};
