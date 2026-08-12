const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// GET /api/areas
const listAreas = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM areas ORDER BY name');
  res.json(rows);
});

// GET /api/areas/:id
const getArea = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM areas WHERE area_id = $1', [req.params.id]);
  if (!rows[0]) throw new ApiError(404, 'Area not found');
  res.json(rows[0]);
});

// POST /api/areas  { name, city, center_lat, center_lng }
const createArea = asyncHandler(async (req, res) => {
  const { name, city, center_lat, center_lng } = req.body;
  if (!name) throw new ApiError(400, 'name is required');
  const { rows } = await db.query(
    `INSERT INTO areas (name, city, center_lat, center_lng) VALUES ($1,$2,$3,$4) RETURNING *`,
    [name, city || null, center_lat || null, center_lng || null]
  );
  res.status(201).json(rows[0]);
});

// PATCH /api/areas/:id
const updateArea = asyncHandler(async (req, res) => {
  const { name, city, center_lat, center_lng } = req.body;
  const { rows } = await db.query(
    `UPDATE areas SET
       name = COALESCE($1, name), city = COALESCE($2, city),
       center_lat = COALESCE($3, center_lat), center_lng = COALESCE($4, center_lng)
     WHERE area_id = $5 RETURNING *`,
    [name, city, center_lat, center_lng, req.params.id]
  );
  if (!rows[0]) throw new ApiError(404, 'Area not found');
  res.json(rows[0]);
});

// DELETE /api/areas/:id
const deleteArea = asyncHandler(async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM areas WHERE area_id = $1', [req.params.id]);
  if (!rowCount) throw new ApiError(404, 'Area not found');
  res.status(204).send();
});

module.exports = { listAreas, getArea, createArea, updateArea, deleteArea };
