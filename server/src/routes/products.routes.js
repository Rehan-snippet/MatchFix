const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImage,
  deleteProductImage,
  getProductReviewEligibility,
  createProductReview,
} = require('../controllers/products.controller');

router.get('/', listProducts);
router.get('/:id', getProduct);
router.get('/:id/review-eligibility', requireAuth, getProductReviewEligibility);
router.post('/:id/reviews', requireAuth, requireRole('customer'), createProductReview);

router.post('/', requireAuth, requireRole('seller'), createProduct);
router.patch('/:id', requireAuth, requireRole('seller'), updateProduct);
router.delete('/:id', requireAuth, requireRole('seller'), deleteProduct);

router.post('/:id/images', requireAuth, requireRole('seller'), upload.single('image'), addProductImage);
router.delete('/:productId/images/:imageId', requireAuth, requireRole('seller'), deleteProductImage);

module.exports = router;
