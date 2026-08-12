const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// GET /api/products?category=&seller_id=&q=
const listProducts = asyncHandler(async (req, res) => {
  const { category, seller_id, q } = req.query;
  const conditions = ['p.is_active = TRUE'];
  const params = [];

  if (category) {
    params.push(category);
    conditions.push(`p.category ILIKE $${params.length}`);
  }
  if (seller_id) {
    params.push(seller_id);
    conditions.push(`p.seller_id = $${params.length}`);
  }
  if (q) {
    params.push(`%${q}%`);
    conditions.push(`p.title ILIKE $${params.length}`);
  }

  const { rows } = await db.query(
    `SELECT p.*, s.shop_name,
            (SELECT url FROM product_images pi WHERE pi.product_id = p.product_id AND pi.is_cover = TRUE LIMIT 1) AS cover_image,
            (SELECT ROUND(AVG(pr.rating)::numeric, 1) FROM product_reviews pr
               JOIN order_items oi ON oi.order_id = pr.order_id AND oi.product_id = pr.product_id
               WHERE oi.product_id = p.product_id) AS avg_rating
     FROM products p
     JOIN sellers s ON s.user_id = p.seller_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY p.created_at DESC`,
    params
  );
  res.json(rows);
});

// GET /api/products/:id  (+ images + reviews)
const getProduct = asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    `SELECT p.*, s.shop_name FROM products p JOIN sellers s ON s.user_id = p.seller_id WHERE p.product_id = $1`,
    [req.params.id]
  );
  if (!rows[0]) throw new ApiError(404, 'Product not found');

  const [images, reviews] = await Promise.all([
    db.query('SELECT * FROM product_images WHERE product_id = $1 ORDER BY is_cover DESC, image_id', [req.params.id]),
    db.query(
      `SELECT pr.*, u.name AS reviewer_name FROM product_reviews pr
       JOIN orders o ON o.order_id = pr.order_id
       JOIN customers c ON c.user_id = o.customer_id
       JOIN users u ON u.user_id = c.user_id
       WHERE pr.product_id = $1 ORDER BY pr.created_at DESC`,
      [req.params.id]
    ),
  ]);

  res.json({ ...rows[0], images: images.rows, reviews: reviews.rows });
});

async function assertOwnsProduct(productId, sellerId) {
  const { rows } = await db.query('SELECT * FROM products WHERE product_id = $1', [productId]);
  if (!rows[0]) throw new ApiError(404, 'Product not found');
  if (rows[0].seller_id !== sellerId) throw new ApiError(403, 'You do not own this product');
  return rows[0];
}

// POST /api/products  (seller)
const createProduct = asyncHandler(async (req, res) => {
  const { title, category, description, price, condition, stock } = req.body;
  if (!title || price === undefined) throw new ApiError(400, 'title and price are required');

  const { rows } = await db.query(
    `INSERT INTO products (seller_id, title, category, description, price, condition, stock)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.user.user_id, title, category || null, description || null, price, condition || null, stock || 0]
  );
  res.status(201).json(rows[0]);
});

// PATCH /api/products/:id  (owning seller)
const updateProduct = asyncHandler(async (req, res) => {
  await assertOwnsProduct(req.params.id, req.user.user_id);
  const { title, category, description, price, condition, stock, is_active } = req.body;

  const { rows } = await db.query(
    `UPDATE products SET
       title = COALESCE($1,title), category = COALESCE($2,category), description = COALESCE($3,description),
       price = COALESCE($4,price), condition = COALESCE($5,condition), stock = COALESCE($6,stock),
       is_active = COALESCE($7,is_active)
     WHERE product_id = $8 RETURNING *`,
    [title, category, description, price, condition, stock, is_active, req.params.id]
  );
  res.json(rows[0]);
});

// DELETE /api/products/:id  (owning seller)
const deleteProduct = asyncHandler(async (req, res) => {
  await assertOwnsProduct(req.params.id, req.user.user_id);
  await db.query('DELETE FROM products WHERE product_id = $1', [req.params.id]);
  res.status(204).send();
});

// POST /api/products/:id/images  { url, is_cover }  -- "shows"
const addProductImage = asyncHandler(async (req, res) => {
  await assertOwnsProduct(req.params.id, req.user.user_id);
  const { url, is_cover } = req.body;
  if (!url) throw new ApiError(400, 'url is required');

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    if (is_cover) {
      await client.query('UPDATE product_images SET is_cover = FALSE WHERE product_id = $1', [req.params.id]);
    }
    const { rows } = await client.query(
      'INSERT INTO product_images (product_id, url, is_cover) VALUES ($1,$2,$3) RETURNING *',
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

// DELETE /api/products/:productId/images/:imageId
const deleteProductImage = asyncHandler(async (req, res) => {
  await assertOwnsProduct(req.params.productId, req.user.user_id);
  const { rowCount } = await db.query(
    'DELETE FROM product_images WHERE image_id = $1 AND product_id = $2',
    [req.params.imageId, req.params.productId]
  );
  if (!rowCount) throw new ApiError(404, 'Image not found');
  res.status(204).send();
});

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImage,
  deleteProductImage,
  assertOwnsProduct,
};
