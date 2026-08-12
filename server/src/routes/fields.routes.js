const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  listFields,
  getField,
  createField,
  updateField,
  deleteField,
  addPricingRule,
  updatePricingRule,
  deletePricingRule,
  getPriceHistory,
} = require('../controllers/fields.controller');

router.get('/', listFields);
router.get('/:id', getField);

router.post('/', requireAuth, requireRole('organizer'), createField);
router.patch('/:id', requireAuth, requireRole('organizer'), updateField);
router.delete('/:id', requireAuth, requireRole('organizer'), deleteField);

router.post('/:id/pricing-rules', requireAuth, requireRole('organizer'), addPricingRule);
router.patch('/:fieldId/pricing-rules/:ruleId', requireAuth, requireRole('organizer'), updatePricingRule);
router.delete('/:fieldId/pricing-rules/:ruleId', requireAuth, requireRole('organizer'), deletePricingRule);
router.get('/:fieldId/pricing-rules/:ruleId/history', requireAuth, requireRole('organizer'), getPriceHistory);

module.exports = router;
