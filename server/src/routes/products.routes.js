const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImage,
  deleteProductImage,
} = require('../controllers/products.controller');

router.get('/', listProducts);
router.get('/:id', getProduct);

router.post('/', requireAuth, requireRole('seller'), createProduct);
router.patch('/:id', requireAuth, requireRole('seller'), updateProduct);
router.delete('/:id', requireAuth, requireRole('seller'), deleteProduct);

router.post('/:id/images', requireAuth, requireRole('seller'), addProductImage);
router.delete('/:productId/images/:imageId', requireAuth, requireRole('seller'), deleteProductImage);

module.exports = router;
