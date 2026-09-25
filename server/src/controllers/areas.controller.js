const db = require('../config/db');

/**
 * GET /api/areas
 */
async function listAreas(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT area_id, name, city, center_lat, center_lng,
        (SELECT COUNT(*)::INT FROM turfs t WHERE t.area_id = a.area_id) AS turf_count
       FROM areas a
       ORDER BY name ASC`
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/areas/:id
 */
async function getArea(req, res) {
  const { id } = req.params;
  try {
    const { rows } = await db.query('SELECT * FROM areas WHERE area_id = $1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Area not found.' });
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/areas
 * DML 4: Uses withTransaction
 */
async function createArea(req, res) {
  const { name, city = 'Dhaka', center_lat, center_lng } = req.body;
  if (!name) return res.status(400).json({ error: 'Area name is required.' });

  try {
    const area = await db.withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO areas (name, city, center_lat, center_lng)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [name, city, center_lat || null, center_lng || null]
      );
      return rows[0];
    });

    return res.status(201).json(area);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An area with this name already exists.' });
    }
    return res.status(500).json({ error: err.message });
  }
}

/**
 * PUT /api/areas/:id
 * DML 5: Uses withTransaction
 */
async function updateArea(req, res) {
  const { id } = req.params;
  const { name, city, center_lat, center_lng } = req.body;

  try {
    const area = await db.withTransaction(async (client) => {
      const { rows } = await client.query(
        `UPDATE areas
         SET name = COALESCE($1, name),
             city = COALESCE($2, city),
             center_lat = COALESCE($3, center_lat),
             center_lng = COALESCE($4, center_lng)
         WHERE area_id = $5
         RETURNING *`,
        [name, city, center_lat, center_lng, id]
      );
      if (!rows.length) throw new Error('Area not found.');
      return rows[0];
    });

    return res.json(area);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * DELETE /api/areas/:id
 * DML 6: Uses withTransaction
 */
async function deleteArea(req, res) {
  const { id } = req.params;

  try {
    await db.withTransaction(async (client) => {
      const check = await client.query('SELECT COUNT(*)::INT as count FROM turfs WHERE area_id = $1', [id]);
      if (check.rows[0].count > 0) {
        throw new Error('Cannot delete area containing active turfs. Reassign or delete turfs first.');
      }
      const resDel = await client.query('DELETE FROM areas WHERE area_id = $1', [id]);
      if (resDel.rowCount === 0) throw new Error('Area not found.');
    });

    return res.json({ message: 'Area deleted successfully.' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

module.exports = {
  listAreas,
  getArea,
  createArea,
  updateArea,
  deleteArea,
};