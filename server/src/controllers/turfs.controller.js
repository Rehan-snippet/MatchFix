const fs = require('fs');
const path = require('path');
const db = require('../config/db');

/**
 * GET /api/turfs
 */
async function listTurfs(req, res) {
  const { area_id, min_rate, max_rate, search, keyword, q, organizer_id, status, page = 1, limit = 100 } = req.query;
  const searchTerm = search || keyword || q;

  try {
    let queryText = `
      SELECT
        t.turf_id,
        t.name,
        t.address,
        t.hourly_rate,
        t.latitude,
        t.longitude,
        t.description,
        t.approval_status,
        t.rejection_reason,
        t.created_at,
        a.name AS area_name,
        u.name AS organizer_name,
        fn_turf_avg_rating(t.turf_id) AS average_rating,
        fn_turf_avg_rating(t.turf_id) AS rating,
        (
          SELECT COUNT(DISTINCT tr.review_id)::INT
          FROM turf_reviews tr
          JOIN bookings b ON tr.booking_id = b.booking_id
          JOIN booking_slots bs ON b.booking_id = bs.booking_id
          JOIN fields f ON bs.field_id = f.field_id
          WHERE f.turf_id = t.turf_id AND b.status <> 'cancelled'
        ) AS review_count,
        (
          SELECT ti.url FROM turf_images ti
          WHERE ti.turf_id = t.turf_id AND ti.is_cover = TRUE
          LIMIT 1
        ) AS cover_image,
        (
          SELECT COUNT(*)::INT FROM fields f WHERE f.turf_id = t.turf_id
        ) AS field_count,
        (
          SELECT COALESCE(json_agg(json_build_object(
            'field_id', f.field_id,
            'name', f.name,
            'surface', f.surface,
            'side_type', f.side_type
          ) ORDER BY f.field_id), '[]'::json)
          FROM fields f WHERE f.turf_id = t.turf_id
        ) AS fields
      FROM turfs t
      JOIN areas a ON t.area_id = a.area_id
      JOIN users u ON t.organizer_id = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (area_id) {
      params.push(area_id);
      queryText += ` AND t.area_id = $${params.length}`;
    }
    if (min_rate) {
      params.push(min_rate);
      queryText += ` AND t.hourly_rate >= $${params.length}`;
    }
    if (max_rate) {
      params.push(max_rate);
      queryText += ` AND t.hourly_rate <= $${params.length}`;
    }
    if (searchTerm) {
      params.push(`%${searchTerm}%`);
      queryText += ` AND (t.name ILIKE $${params.length} OR t.address ILIKE $${params.length} OR a.name ILIKE $${params.length})`;
    }
    if (organizer_id) {
      params.push(organizer_id);
      queryText += ` AND t.organizer_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      queryText += ` AND t.approval_status = $${params.length}`;
    } else if (!organizer_id) {
      queryText += ` AND t.approval_status = 'approved'`;
    }

    queryText += ` ORDER BY t.created_at DESC`;

    const limitVal = parseInt(limit, 10);
    const offsetVal = (parseInt(page, 10) - 1) * limitVal;
    
    params.push(limitVal);
    queryText += ` LIMIT $${params.length}`;
    
    params.push(offsetVal);
    queryText += ` OFFSET $${params.length}`;

    const { rows } = await db.query(queryText, params);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/turfs/:id
 */
async function getTurf(req, res) {
  const { id } = req.params;

  try {
    const { rows } = await db.query(
      `SELECT
        t.*,
        a.name AS area_name,
        u.name AS organizer_name,
        fn_turf_avg_rating(t.turf_id) AS average_rating,
        (
          SELECT json_agg(json_build_object('image_id', ti.image_id, 'url', ti.url, 'is_cover', ti.is_cover))
          FROM turf_images ti WHERE ti.turf_id = t.turf_id
        ) AS images,
        (
          SELECT COALESCE(json_agg(json_build_object(
            'field_id', f.field_id,
            'name', f.name,
            'surface', f.surface,
            'side_type', f.side_type,
            'pricing_rules', (
              SELECT COALESCE(json_agg(json_build_object(
                'rule_id', pr.rule_id,
                'day_of_week', pr.day_of_week,
                'start_time', pr.start_time,
                'end_time', pr.end_time,
                'hourly_rate', pr.hourly_rate
              ) ORDER BY pr.day_of_week, pr.start_time), '[]'::json)
              FROM pricing_rules pr WHERE pr.field_id = f.field_id
            )
          ) ORDER BY f.field_id), '[]'::json)
          FROM fields f WHERE f.turf_id = t.turf_id
        ) AS fields,
        (
          SELECT COALESCE(json_agg(json_build_object(
            'review_id', tr.review_id,
            'rating', tr.rating,
            'comment', tr.comment,
            'customer_name', cu.name,
            'created_at', tr.created_at
          )), '[]'::json)
          FROM (
            SELECT DISTINCT ON (tr_inner.review_id)
              tr_inner.review_id,
              tr_inner.rating,
              tr_inner.comment,
              tr_inner.created_at,
              b_inner.customer_id
            FROM turf_reviews tr_inner
            JOIN bookings b_inner ON tr_inner.booking_id = b_inner.booking_id
            JOIN booking_slots bs_inner ON b_inner.booking_id = bs_inner.booking_id
            JOIN fields f_inner ON bs_inner.field_id = f_inner.field_id
            WHERE f_inner.turf_id = t.turf_id
              AND b_inner.status <> 'cancelled'
            ORDER BY tr_inner.review_id, tr_inner.created_at DESC
          ) tr
          JOIN users cu ON tr.customer_id = cu.user_id
        ) AS reviews
       FROM turfs t
       JOIN areas a ON t.area_id = a.area_id
       JOIN users u ON t.organizer_id = u.user_id
       WHERE t.turf_id = $1`,
      [id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Turf not found.' });
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/turfs
 * DML 7: Uses withTransaction
 */
async function createTurf(req, res) {
  const { area_id, name, address, hourly_rate, latitude, longitude, description, cover_url } = req.body;

  if (!area_id || !name || !address) {
    return res.status(400).json({ error: 'area_id, name, and address are required.' });
  }

  try {
    const turf = await db.withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO turfs (organizer_id, area_id, name, address, hourly_rate, latitude, longitude, description, approval_status)
         VALUES ($1, $2, $3, $4, COALESCE($5, 1200.00), $6, $7, $8, 'pending')
         RETURNING *`,
        [req.user.user_id, area_id, name, address, hourly_rate, latitude || null, longitude || null, description || null]
      );
      const newTurf = rows[0];

      if (cover_url) {
        await client.query(
          `INSERT INTO turf_images (turf_id, url, is_cover) VALUES ($1, $2, TRUE)`,
          [newTurf.turf_id, cover_url]
        );
      }

      return newTurf;
    });

    return res.status(201).json(turf);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * PUT /api/turfs/:id
 * DML 8: Uses withTransaction
 */
async function updateTurf(req, res) {
  const { id } = req.params;
  const { area_id, name, address, hourly_rate, latitude, longitude, description } = req.body;

  try {
    const turf = await db.withTransaction(async (client) => {
      const check = await client.query('SELECT organizer_id FROM turfs WHERE turf_id = $1 FOR UPDATE', [id]);
      if (!check.rows.length) throw new Error('Turf not found.');
      if (!req.user.is_admin && check.rows[0].organizer_id !== req.user.user_id) throw new Error('Unauthorized.');

      const { rows } = await client.query(
        `UPDATE turfs
         SET area_id = COALESCE($1, area_id),
             name = COALESCE($2, name),
             address = COALESCE($3, address),
             hourly_rate = COALESCE($4, hourly_rate),
             latitude = COALESCE($5, latitude),
             longitude = COALESCE($6, longitude),
             description = COALESCE($7, description)
         WHERE turf_id = $8
         RETURNING *`,
        [area_id, name, address, hourly_rate, latitude, longitude, description, id]
      );
      return rows[0];
    });

    return res.json(turf);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * DELETE /api/turfs/:id
 * DML 9: Uses withTransaction
 */
async function deleteTurf(req, res) {
  const { id } = req.params;

  try {
    await db.withTransaction(async (client) => {
      const check = await client.query('SELECT organizer_id FROM turfs WHERE turf_id = $1 FOR UPDATE', [id]);
      if (!check.rows.length) throw new Error('Turf not found.');
      if (!req.user.is_admin && check.rows[0].organizer_id !== req.user.user_id) throw new Error('Unauthorized.');

      await client.query('DELETE FROM turfs WHERE turf_id = $1', [id]);
    });

    return res.json({ message: 'Turf deleted successfully.' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * POST /api/turfs/:id/images
 * DML 10: Uses withTransaction
 */
async function addTurfImage(req, res) {
  const { id } = req.params;
  const is_cover = req.body.is_cover === true || req.body.is_cover === 'true';
  const url = req.file ? `/uploads/turfs/${req.file.filename}` : req.body.url;

  if (!url) return res.status(400).json({ error: 'Image file or URL is required.' });

  try {
    const image = await db.withTransaction(async (client) => {
      const check = await client.query('SELECT organizer_id FROM turfs WHERE turf_id = $1', [id]);
      if (!check.rows.length) throw new Error('Turf not found.');
      if (!req.user.is_admin && check.rows[0].organizer_id !== req.user.user_id) throw new Error('Unauthorized.');

      if (is_cover) {
        await client.query('UPDATE turf_images SET is_cover = FALSE WHERE turf_id = $1', [id]);
      }

      const { rows } = await client.query(
        `INSERT INTO turf_images (turf_id, url, is_cover) VALUES ($1, $2, $3) RETURNING *`,
        [id, url, is_cover]
      );
      return rows[0];
    });

    return res.status(201).json(image);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * DELETE /api/turfs/:turfId/images/:imageId
 * DML 11: Uses withTransaction
 */
async function deleteTurfImage(req, res) {
  const { turfId, imageId } = req.params;

  try {
    const deletedImage = await db.withTransaction(async (client) => {
      const check = await client.query('SELECT organizer_id FROM turfs WHERE turf_id = $1', [turfId]);
      if (!check.rows.length) throw new Error('Turf not found.');
      if (!req.user.is_admin && check.rows[0].organizer_id !== req.user.user_id) throw new Error('Unauthorized.');

      const delRes = await client.query(
        'DELETE FROM turf_images WHERE image_id = $1 AND turf_id = $2 RETURNING url, is_cover',
        [imageId, turfId]
      );
      if (!delRes.rows.length) throw new Error('Image not found.');

      if (delRes.rows[0].is_cover) {
        await client.query(
          `UPDATE turf_images SET is_cover = TRUE
           WHERE image_id = (SELECT image_id FROM turf_images WHERE turf_id = $1 LIMIT 1)`,
          [turfId]
        );
      }
      return delRes.rows[0];
    });

    // Clean up local disk file if uploaded
    if (deletedImage?.url && deletedImage.url.startsWith('/uploads/')) {
      try {
        const filePath = path.join(__dirname, '..', '..', deletedImage.url.replace(/^\//, ''));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fsErr) {
        console.warn('Failed to delete turf image from disk:', fsErr.message);
      }
    }

    return res.json({ message: 'Image deleted successfully.' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * PATCH /api/turfs/:turfId/images/:imageId/cover
 * DML 12: Uses withTransaction
 */
async function setCoverImage(req, res) {
  const { turfId, imageId } = req.params;

  try {
    await db.withTransaction(async (client) => {
      const check = await client.query('SELECT organizer_id FROM turfs WHERE turf_id = $1', [turfId]);
      if (!check.rows.length) throw new Error('Turf not found.');
      if (!req.user.is_admin && check.rows[0].organizer_id !== req.user.user_id) throw new Error('Unauthorized.');

      await client.query('UPDATE turf_images SET is_cover = FALSE WHERE turf_id = $1', [turfId]);
      const resCover = await client.query(
        'UPDATE turf_images SET is_cover = TRUE WHERE image_id = $1 AND turf_id = $2',
        [imageId, turfId]
      );
      if (resCover.rowCount === 0) throw new Error('Image not found.');
    });

    return res.json({ message: 'Cover image updated successfully.' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

module.exports = {
  listTurfs,
  getTurf,
  createTurf,
  updateTurf,
  deleteTurf,
  addTurfImage,
  deleteTurfImage,
  setCoverImage,
};