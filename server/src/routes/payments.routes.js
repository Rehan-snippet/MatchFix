const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  initiatePayment,
  confirmSandboxPayment,
  handleWebhook,
  createPayment,
  listPayments,
} = require('../controllers/payments.controller');

// Webhook is public (called by external payment systems)
router.post('/webhook', handleWebhook);

// Protected payment endpoints
router.use(requireAuth);

router.post('/initiate', requireRole('customer'), initiatePayment);
router.post('/confirm', requireRole('customer'), confirmSandboxPayment);
router.post('/', requireRole('customer'), createPayment);
router.get('/', listPayments);

module.exports = router;
