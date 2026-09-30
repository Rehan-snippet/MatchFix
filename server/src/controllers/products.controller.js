const fs = require('fs');
const path = require('path');
const db = require('../config/db');

/**
 * GET /api/products
 */
async function listProducts(req, res) {
  const { category, condition, min_price, max_price, search, q, keyword, seller_id, status, page = 1, limit = 100 } = req.query;
  const searchTerm = search || q || keyword;

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
        p.approval_status,
        p.rejection_reason,
        p.created_at,
        s.shop_name,
        u.name AS seller_name,
        COALESCE(
          (SELECT ROUND(AVG(pr.rating)::NUMERIC, 2) FROM product_reviews pr WHERE pr.product_id = p.product_id),
          NULL
        ) AS average_rating,
        COALESCE(
          (SELECT ROUND(AVG(pr.rating)::NUMERIC, 2) FROM product_reviews pr WHERE pr.product_id = p.product_id),
          NULL
        ) AS avg_rating,
        (SELECT COUNT(*)::INT FROM product_reviews pr WHERE pr.product_id = p.product_id) AS review_count,
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

    if (category && category !== 'All Items') {
      const catLower = category.toLowerCase().trim();
      if (catLower.includes('boot') || catLower.includes('footwear')) {
        queryText += ` AND (p.category ILIKE '%boot%' OR p.category ILIKE '%footwear%')`;
      } else if (catLower.includes('ball')) {
        queryText += ` AND p.category ILIKE '%ball%'`;
      } else if (catLower.includes('jersey') || catLower.includes('kit') || catLower.includes('apparel')) {
        queryText += ` AND (p.category ILIKE '%jersey%' OR p.category ILIKE '%kit%' OR p.category ILIKE '%apparel%')`;
      } else if (catLower.includes('glove') || catLower.includes('goalkeeper')) {
        queryText += ` AND (p.category ILIKE '%glove%' OR p.category ILIKE '%goalkeeper%')`;
      } else if (catLower.includes('train') || catLower.includes('equipment')) {
        queryText += ` AND (p.category ILIKE '%train%' OR p.category ILIKE '%equipment%')`;
      } else if (catLower.includes('access')) {
        queryText += ` AND p.category ILIKE '%access%'`;
      } else {
        params.push(`%${category}%`);
        queryText += ` AND p.category ILIKE $${params.length}`;
      }
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
    if (searchTerm) {
      params.push(`%${searchTerm}%`);
      queryText += ` AND (p.title ILIKE $${params.length} OR p.description ILIKE $${params.length} OR p.category ILIKE $${params.length})`;
    }
    if (seller_id) {
      params.push(seller_id);
      queryText += ` AND p.seller_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      queryText += ` AND p.approval_status = $${params.length}`;
    } else if (!seller_id) {
      queryText += ` AND p.approval_status = 'approved'`;
    }

    queryText += ` ORDER BY p.created_at DESC`;

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
        COALESCE(
          (SELECT ROUND(AVG(pr.rating)::NUMERIC, 2) FROM product_reviews pr WHERE pr.product_id = p.product_id),
          NULL
        ) AS average_rating,
        COALESCE(
          (SELECT ROUND(AVG(pr.rating)::NUMERIC, 2) FROM product_reviews pr WHERE pr.product_id = p.product_id),
          NULL
        ) AS avg_rating,
        (SELECT COUNT(*)::INT FROM product_reviews pr WHERE pr.product_id = p.product_id) AS review_count,
        (
          SELECT COALESCE(json_agg(json_build_object('image_id', pi.image_id, 'url', pi.url, 'is_cover', pi.is_cover)), '[]'::json)
          FROM product_images pi WHERE pi.product_id = p.product_id
        ) AS images,
        (
          SELECT COALESCE(json_agg(json_build_object(
            'review_id', pr.review_id,
            'rating', pr.rating,
            'comment', pr.comment,
            'customer_name', cu.name,
            'created_at', pr.created_at
          ) ORDER BY pr.created_at DESC), '[]'::json)
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
        `INSERT INTO products (seller_id, title, price, category, condition, stock, description, approval_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
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
      if (!req.user.is_admin && check.rows[0].seller_id !== req.user.user_id) throw new Error('Unauthorized: You do not own this product listing.');

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
        [
          title !== undefined ? title : null,
          price !== undefined ? price : null,
          category !== undefined ? category : null,
          condition !== undefined ? condition : null,
          stock !== undefined ? stock : null,
          description !== undefined ? description : null,
          id
        ]
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
      if (!req.user.is_admin && check.rows[0].seller_id !== req.user.user_id) throw new Error('Unauthorized.');

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
  const is_cover = req.body.is_cover === true || req.body.is_cover === 'true';
  const url = req.file ? `/uploads/products/${req.file.filename}` : req.body.url;

  if (!url) return res.status(400).json({ error: 'Image file or URL is required.' });

  try {
    const image = await db.withTransaction(async (client) => {
      const check = await client.query('SELECT seller_id FROM products WHERE product_id = $1', [id]);
      if (!check.rows.length) throw new Error('Product not found.');
      if (!req.user.is_admin && check.rows[0].seller_id !== req.user.user_id) throw new Error('Unauthorized.');

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
    const deletedImage = await db.withTransaction(async (client) => {
      const check = await client.query('SELECT seller_id FROM products WHERE product_id = $1', [productId]);
      if (!check.rows.length) throw new Error('Product not found.');
      if (!req.user.is_admin && check.rows[0].seller_id !== req.user.user_id) throw new Error('Unauthorized.');

      const del = await client.query(
        'DELETE FROM product_images WHERE image_id = $1 AND product_id = $2 RETURNING url, is_cover',
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
      return del.rows[0];
    });

    // Clean up local disk file if uploaded
    if (deletedImage?.url && deletedImage.url.startsWith('/uploads/')) {
      try {
        const filePath = path.join(__dirname, '..', '..', deletedImage.url.replace(/^\//, ''));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fsErr) {
        console.warn('Failed to delete product image from disk:', fsErr.message);
      }
    }

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
      if (!req.user.is_admin && check.rows[0].seller_id !== req.user.user_id) throw new Error('Unauthorized.');

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

/**
 * GET /api/products/:id/review-eligibility
 * Checks if logged-in customer can review this product
 */
async function getProductReviewEligibility(req, res) {
  const { id } = req.params;

  try {
    const { rows: orderRows } = await db.query(
      `SELECT o.order_id, o.status, o.created_at
       FROM orders o
       JOIN order_items oi ON o.order_id = oi.order_id
       WHERE oi.product_id = $1 AND o.customer_id = $2 AND o.status <> 'cancelled'
       ORDER BY o.order_id DESC
       LIMIT 1`,
      [id, req.user.user_id]
    );

    if (!orderRows.length) {
      return res.json({
        can_review: false,
        reason: 'Only customers who have ordered this gear can submit a review.',
        existing_review: null,
      });
    }

    const matchedOrder = orderRows[0];
    const { rows: reviewRows } = await db.query(
      `SELECT review_id, order_id, product_id, rating, comment, created_at
       FROM product_reviews
       WHERE order_id = $1 AND product_id = $2`,
      [matchedOrder.order_id, id]
    );

    return res.json({
      can_review: true,
      order_id: matchedOrder.order_id,
      order_status: matchedOrder.status,
      existing_review: reviewRows[0] || null,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/products/:id/reviews
 * Creates or updates review for a purchased product
 */
async function createProductReview(req, res) {
  const { id } = req.params;
  const { rating, comment, order_id } = req.body;

  const numRating = parseInt(rating, 10);
  if (!numRating || numRating < 1 || numRating > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5 stars.' });
  }

  try {
    let targetOrderId = order_id;

    if (!targetOrderId) {
      const { rows } = await db.query(
        `SELECT o.order_id
         FROM orders o
         JOIN order_items oi ON o.order_id = oi.order_id
         WHERE oi.product_id = $1 AND o.customer_id = $2 AND o.status <> 'cancelled'
         ORDER BY o.order_id DESC
         LIMIT 1`,
        [id, req.user.user_id]
      );
      if (!rows.length) {
        return res.status(403).json({ error: 'Only verified buyers who have ordered this gear can submit a review.' });
      }
      targetOrderId = rows[0].order_id;
    } else {
      // Validate customer ownership of provided order_id
      const { rows } = await db.query(
        `SELECT o.order_id
         FROM orders o
         JOIN order_items oi ON o.order_id = oi.order_id
         WHERE o.order_id = $1 AND oi.product_id = $2 AND o.customer_id = $3 AND o.status <> 'cancelled'`,
        [targetOrderId, id, req.user.user_id]
      );
      if (!rows.length) {
        return res.status(403).json({ error: 'Order not found or unauthorized to review this product.' });
      }
    }

    const { rows: inserted } = await db.query(
      `INSERT INTO product_reviews (order_id, product_id, rating, comment, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (order_id, product_id) DO UPDATE SET rating = $3, comment = $4, created_at = NOW()
       RETURNING *`,
      [targetOrderId, id, numRating, comment ? comment.trim() : null]
    );

    return res.status(201).json(inserted[0]);
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
  getProductReviewEligibility,
  createProductReview,
};