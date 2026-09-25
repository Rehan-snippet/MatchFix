const db = require('../config/db');
const { parsePagination, paginatedResponse } = require('../utils/paginate');

/**
 * GET /api/products
 */
async function listProducts(req, res) {
  const { category, condition, min_price, max_price, search, all } = req.query;

  try {
    let queryText = `
      SELECT
        p.product_id,
        p.title,
        p.price,
        p.category,
        p.condition,
        p.stock,
        p.description,
        p.created_at,
        s.shop_name,
        u.name AS seller_name,
        COALESCE(
          (SELECT ROUND(AVG(pr.rating)::NUMERIC, 2) FROM product_reviews pr WHERE pr.product_id = p.product_id),
          NULL
        ) AS average_rating,
        (
          SELECT pi.url FROM product_images pi
          WHERE pi.product_id = p.product_id AND pi.is_cover = TRUE
          LIMIT 1
        ) AS cover_image
      FROM products p
      JOIN sellers s ON p.seller_id = s.user_id
      JOIN users u ON s.user_id = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      params.push(category);
      queryText += ` AND p.category = $${params.length}`;
    }
    if (condition) {
      params.push(condition);
      queryText += ` AND p.condition = $${params.length}`;
    }
    if (min_price) {
      params.push(min_price);
      queryText += ` AND p.price >= $${params.length}`;
    }
    if (max_price) {
      params.push(max_price);
      queryText += ` AND p.price <= $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      queryText += ` AND (p.title ILIKE $${params.length} OR p.description ILIKE $${params.length})`;
    }

    queryText += ` ORDER BY p.created_at DESC`;

    if (all === 'true') {
      const { rows } = await db.query(queryText, params);
      return res.json({ data: rows, pagination: { total: rows.length, page: 1, page_size: rows.length, total_pages: 1 } });
    }

    const countRes = await db.query(
      `SELECT COUNT(*)::INT AS total FROM (${queryText}) AS count_sub`,
      params
    );
    const total = countRes.rows[0]?.total || 0;

    const { page, pageSize, offset } = parsePagination(req.query, 12);
    const pagedQuery = `${queryText} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const pagedParams = [...params, pageSize, offset];

    const { rows } = await db.query(pagedQuery, pagedParams);
    return res.json(paginatedResponse(rows, total, page, pageSize));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/products/:id
 */
async function getProduct(req, res) {
  const { id } = req.params;

  try {
    const { rows } = await db.query(
      `SELECT
        p.*,
        s.shop_name,
        u.name AS seller_name,
        (
          SELECT json_agg(json_build_object('image_id', pi.image_id, 'url', pi.url, 'is_cover', pi.is_cover))
          FROM product_images pi WHERE pi.product_id = p.product_id
        ) AS images,
        (
          SELECT json_agg(json_build_object(
            'review_id', pr.review_id,
            'rating', pr.rating,
            'comment', pr.comment,
            'customer_name', cu.name,
            'created_at', pr.created_at
          ))
          FROM product_reviews pr
          JOIN orders o ON pr.order_id = o.order_id
          JOIN users cu ON o.customer_id = cu.user_id
          WHERE pr.product_id = p.product_id
        ) AS reviews
       FROM products p
       JOIN sellers s ON p.seller_id = s.user_id
       JOIN users u ON s.user_id = u.user_id
       WHERE p.product_id = $1`,
      [id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Product not found.' });
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/products
 * DML 25: Uses withTransaction
 */
async function createProduct(req, res) {
  const { title, price, category, condition = 'new', stock = 0, description, cover_url } = req.body;

  if (!title || price === undefined || !category) {
    return res.status(400).json({ error: 'Title, price, and category are required.' });
  }

  try {
    const product = await db.withTransaction(async (client) => {
      const checkSeller = await client.query('SELECT user_id FROM sellers WHERE user_id = $1', [req.user.user_id]);
      if (!checkSeller.rows.length) throw new Error('User does not have a verified Seller account.');

      const { rows } = await client.query(
        `INSERT INTO products (seller_id, title, price, category, condition, stock, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [req.user.user_id, title, price, category, condition, stock, description || null]
      );
      const newProduct = rows[0];

      if (cover_url) {
        await client.query(
          `INSERT INTO product_images (product_id, url, is_cover) VALUES ($1, $2, TRUE)`,
          [newProduct.product_id, cover_url]
        );
      }

      return newProduct;
    });

    return res.status(201).json(product);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * PUT /api/products/:id
 * DML 26: Uses withTransaction
 */
async function updateProduct(req, res) {
  const { id } = req.params;
  const { title, price, category, condition, stock, description } = req.body;

  try {
    const product = await db.withTransaction(async (client) => {
      const check = await client.query('SELECT seller_id FROM products WHERE product_id = $1 FOR UPDATE', [id]);
      if (!check.rows.length) throw new Error('Product not found.');
      if (check.rows[0].seller_id !== req.user.user_id) throw new Error('Unauthorized: You do not own this product listing.');

      const { rows } = await client.query(
        `UPDATE products
         SET title = COALESCE($1, title),
             price = COALESCE($2, price),
             category = COALESCE($3, category),
             condition = COALESCE($4, condition),
             stock = COALESCE($5, stock),
             description = COALESCE($6, description)
         WHERE product_id = $7
         RETURNING *`,
        [title, price, category, condition, stock, description, id]
      );
      return rows[0];
    });

    return res.json(product);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * DELETE /api/products/:id
 * DML 27: Uses withTransaction
 */
async function deleteProduct(req, res) {
  const { id } = req.params;

  try {
    await db.withTransaction(async (client) => {
      const check = await client.query('SELECT seller_id FROM products WHERE product_id = $1 FOR UPDATE', [id]);
      if (!check.rows.length) throw new Error('Product not found.');
      if (check.rows[0].seller_id !== req.user.user_id) throw new Error('Unauthorized.');

      await client.query('DELETE FROM products WHERE product_id = $1', [id]);
    });

    return res.json({ message: 'Product deleted successfully.' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * POST /api/products/:id/images
 * DML 28: Uses withTransaction
 */
async function addProductImage(req, res) {
  const { id } = req.params;
  const { url, is_cover = false } = req.body;

  if (!url) return res.status(400).json({ error: 'Image URL is required.' });

  try {
    const image = await db.withTransaction(async (client) => {
      const check = await client.query('SELECT seller_id FROM products WHERE product_id = $1', [id]);
      if (!check.rows.length) throw new Error('Product not found.');
      if (check.rows[0].seller_id !== req.user.user_id) throw new Error('Unauthorized.');

      if (is_cover) {
        await client.query('UPDATE product_images SET is_cover = FALSE WHERE product_id = $1', [id]);
      }

      const { rows } = await client.query(
        `INSERT INTO product_images (product_id, url, is_cover) VALUES ($1, $2, $3) RETURNING *`,
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
 * DELETE /api/products/:productId/images/:imageId
 * DML 29: Uses withTransaction
 */
async function deleteProductImage(req, res) {
  const { productId, imageId } = req.params;

  try {
    await db.withTransaction(async (client) => {
      const check = await client.query('SELECT seller_id FROM products WHERE product_id = $1', [productId]);
      if (!check.rows.length) throw new Error('Product not found.');
      if (check.rows[0].seller_id !== req.user.user_id) throw new Error('Unauthorized.');

      const del = await client.query(
        'DELETE FROM product_images WHERE image_id = $1 AND product_id = $2 RETURNING is_cover',
        [imageId, productId]
      );
      if (!del.rows.length) throw new Error('Image not found.');

      if (del.rows[0].is_cover) {
        await client.query(
          `UPDATE product_images SET is_cover = TRUE
           WHERE image_id = (SELECT image_id FROM product_images WHERE product_id = $1 LIMIT 1)`,
          [productId]
        );
      }
    });

    return res.json({ message: 'Product image deleted.' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * PATCH /api/products/:productId/images/:imageId/cover
 * DML 30: Uses withTransaction
 */
async function setProductCoverImage(req, res) {
  const { productId, imageId } = req.params;

  try {
    await db.withTransaction(async (client) => {
      const check = await client.query('SELECT seller_id FROM products WHERE product_id = $1', [productId]);
      if (!check.rows.length) throw new Error('Product not found.');
      if (check.rows[0].seller_id !== req.user.user_id) throw new Error('Unauthorized.');

      await client.query('UPDATE product_images SET is_cover = FALSE WHERE product_id = $1', [productId]);
      const resCover = await client.query(
        'UPDATE product_images SET is_cover = TRUE WHERE image_id = $1 AND product_id = $2',
        [imageId, productId]
      );
      if (resCover.rowCount === 0) throw new Error('Image not found.');
    });

    return res.json({ message: 'Cover image updated successfully.' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImage,
  deleteProductImage,
  setProductCoverImage,
};