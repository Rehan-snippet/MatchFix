const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { createPayment, listPayments } = require('../controllers/payments.controller');

router.use(requireAuth);

router.post('/', requireRole('customer'), createPayment);
router.get('/', listPayments);

module.exports = router;
