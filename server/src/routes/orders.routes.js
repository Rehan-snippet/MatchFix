const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  createOrder,
  listMyOrders,
  listOrdersForMyProducts,
  updateOrderItemStatus,
  reviewOrderItem,
} = require('../controllers/orders.controller');

router.use(requireAuth);

router.post('/', requireRole('customer'), createOrder);
router.get('/mine', requireRole('customer'), listMyOrders);
router.get('/for-my-products', requireRole('seller'), listOrdersForMyProducts);
router.patch('/:orderId/items/:productId/status', requireRole('seller'), updateOrderItemStatus);
router.post('/:orderId/items/:productId/review', requireRole('customer'), reviewOrderItem);

module.exports = router;
