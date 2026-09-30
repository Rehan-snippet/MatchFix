const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  createOrder,
  listMyOrders,
  listOrdersForMyProducts,
  updateOrderStatus,
  collectOrderCash,
  addProductReview,
} = require('../controllers/orders.controller');

router.use(requireAuth);

router.post('/', requireRole('customer'), createOrder);
router.get('/mine', requireRole('customer'), listMyOrders);
router.get('/for-my-products', requireRole('seller'), listOrdersForMyProducts);
router.patch('/:id/collect-cash', requireRole('seller'), collectOrderCash);
router.patch('/:orderId/items/:productId/status', requireRole('seller'), updateOrderStatus);
router.post('/:orderId/items/:productId/review', requireRole('customer'), addProductReview);

module.exports = router;
