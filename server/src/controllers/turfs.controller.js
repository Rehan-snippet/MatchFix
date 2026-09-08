const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// GET /api/turfs?area_id=&city=&keyword=&side_type=&surface=&min_price=&max_price=&is_active=true
const listTurfs = asyncHandler(async (req, res) => {
  const { area_id, city, keyword, side_type, surface, is_active } = req.query;
  const conditions = [];
  const params = [];

  if (area_id) {
    params.push(area_id);
    conditions.push(`t.area_id = $${params.length}`);
  }
  if (city) {
    params.push(city);
    conditions.push(`a.city ILIKE $${params.length}`);
  }
  if (keyword) {
    params.push(`%${keyword}%`);
    conditions.push(`(t.name ILIKE $${params.length} OR t.address ILIKE $${params.length} OR a.name ILIKE $${params.length} OR t.description ILIKE $${params.length})`);
  }
  if (is_active !== undefined) {
    params.push(is_active === 'true');
    conditions.push(`t.is_active = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await db.query(
    `SELECT t.*, a.name AS area_name, a.city,
            u.name AS organizer_name,
            (SELECT url FROM turf_images ti WHERE ti.turf_id = t.turf_id AND ti.is_cover = TRUE LIMIT 1) AS cover_image,
            COALESCE((
              SELECT json_agg(ti.url ORDER BY ti.is_cover DESC, ti.image_id ASC)
              FROM turf_images ti
              WHERE ti.turf_id = t.turf_id
            ), '[]'::json) AS images,
            COALESCE((
              SELECT MIN(pr.hourly_rate)
              FROM fields f
              JOIN pricing_rules pr ON pr.field_id = f.field_id
              WHERE f.turf_id = t.turf_id
            ), 1200) AS hourly_rate,
            COALESCE((
              SELECT json_agg(json_build_object('field_id', f.field_id, 'name', f.name, 'side_type', f.side_type, 'surface', f.surface))
              FROM fields f
              WHERE f.turf_id = t.turf_id
            ), '[]'::json) AS fields
     FROM turfs t
     JOIN areas a ON a.area_id = t.area_id
     JOIN organizers o ON o.user_id = t.organizer_id
     JOIN users u ON u.user_id = o.user_id
     ${where}
     ORDER BY t.created_at DESC`,
    params
  );

  // Optional client-side friendly filtering if side_type or surface provided
  let filteredRows = rows;
  if (side_type) {
    filteredRows = filteredRows.filter((r) =>
      Array.isArray(r.fields) && r.fields.some((f) => f.side_type === side_type)
    );
  }
  if (surface) {
    filteredRows = filteredRows.filter((r) =>
      Array.isArray(r.fields) && r.fields.some((f) => f.surface?.toLowerCase().includes(surface.toLowerCase()))
    );
  }

  res.json(filteredRows);
});

// GET /api/turfs/:id  — full detail: turf + images + fields (+ their pricing rules)
const getTurf = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const turfRes = await db.query(
    `SELECT t.*, a.name AS area_name, a.city, u.name AS organizer_name
     FROM turfs t
     JOIN areas a ON a.area_id = t.area_id
     JOIN organizers o ON o.user_id = t.organizer_id
     JOIN users u ON u.user_id = o.user_id
     WHERE t.turf_id = $1`,
    [id]
  );
  if (!turfRes.rows[0]) throw new ApiError(404, 'Turf not found');

  const [images, fields] = await Promise.all([
    db.query('SELECT * FROM turf_images WHERE turf_id = $1 ORDER BY is_cover DESC, image_id', [id]),
    db.query('SELECT * FROM fields WHERE turf_id = $1 ORDER BY field_id', [id]),
  ]);

  const fieldsWithPricing = await Promise.all(
    fields.rows.map(async (field) => {
      const pricing = await db.query(
        'SELECT * FROM pricing_rules WHERE field_id = $1 ORDER BY day_of_week, start_time',
        [field.field_id]
      );
      return { ...field, pricing_rules: pricing.rows };
    })
  );

  res.json({ ...turfRes.rows[0], images: images.rows, fields: fieldsWithPricing });
});

// POST /api/turfs  (organizer) { area_id, name, address, latitude, longitude, description }
const createTurf = asyncHandler(async (req, res) => {
  const { area_id, name, address, latitude, longitude, description } = req.body;
  if (!area_id || !name) throw new ApiError(400, 'area_id and name are required');

  const { rows } = await db.query(
    `INSERT INTO turfs (area_id, organizer_id, name, address, latitude, longitude, description)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [area_id, req.user.user_id, name, address || null, latitude || null, longitude || null, description || null]
  );
  res.status(201).json(rows[0]);
});

// Confirms the turf exists and belongs to the requesting organizer.
async function assertOwnsTurf(turfId, organizerId) {
  const { rows } = await db.query('SELECT * FROM turfs WHERE turf_id = $1', [turfId]);
  if (!rows[0]) throw new ApiError(404, 'Turf not found');
  if (rows[0].organizer_id !== organizerId) throw new ApiError(403, 'You do not own this turf');
  return rows[0];
}

// PATCH /api/turfs/:id  (owning organizer only)
const updateTurf = asyncHandler(async (req, res) => {
  await assertOwnsTurf(req.params.id, req.user.user_id);
  const { name, address, latitude, longitude, description, is_active, area_id } = req.body;

  const { rows } = await db.query(
    `UPDATE turfs SET
       name = COALESCE($1, name), address = COALESCE($2, address),
       latitude = COALESCE($3, latitude), longitude = COALESCE($4, longitude),
       description = COALESCE($5, description), is_active = COALESCE($6, is_active),
       area_id = COALESCE($7, area_id)
     WHERE turf_id = $8 RETURNING *`,
    [name, address, latitude, longitude, description, is_active, area_id, req.params.id]
  );
  res.json(rows[0]);
});

// DELETE /api/turfs/:id  (owning organizer only)
const deleteTurf = asyncHandler(async (req, res) => {
  await assertOwnsTurf(req.params.id, req.user.user_id);
  await db.query('DELETE FROM turfs WHERE turf_id = $1', [req.params.id]);
  res.status(204).send();
});

// POST /api/turfs/:id/images  { url, is_cover }
const addTurfImage = asyncHandler(async (req, res) => {
  await assertOwnsTurf(req.params.id, req.user.user_id);
  const { url, is_cover } = req.body;
  if (!url) throw new ApiError(400, 'url is required');

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    if (is_cover) {
      // "at most one Turf_Image per owner may have is_cover = true"
      await client.query('UPDATE turf_images SET is_cover = FALSE WHERE turf_id = $1', [req.params.id]);
    }
    const { rows } = await client.query(
      'INSERT INTO turf_images (turf_id, url, is_cover) VALUES ($1,$2,$3) RETURNING *',
      [req.params.id, url, !!is_cover]
    );
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// DELETE /api/turfs/:turfId/images/:imageId
const deleteTurfImage = asyncHandler(async (req, res) => {
  await assertOwnsTurf(req.params.turfId, req.user.user_id);
  const { rowCount } = await db.query(
    'DELETE FROM turf_images WHERE image_id = $1 AND turf_id = $2',
    [req.params.imageId, req.params.turfId]
  );
  if (!rowCount) throw new ApiError(404, 'Image not found');
  res.status(204).send();
});

module.exports = {
  listTurfs,
  getTurf,
  createTurf,
  updateTurf,
  deleteTurf,
  addTurfImage,
  deleteTurfImage,
  assertOwnsTurf,
};
