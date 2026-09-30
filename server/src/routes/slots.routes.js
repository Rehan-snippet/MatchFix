const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  listSlots,
  getTurfSchedule,
  generateSlots,
  toggleSlot,
} = require('../controllers/slots.controller');

router.get('/', listSlots);
router.get('/schedule', requireAuth, requireRole('organizer', 'admin'), getTurfSchedule);
router.post('/generate', requireAuth, requireRole('organizer', 'admin'), generateSlots);
router.post('/toggle', requireAuth, requireRole('organizer', 'admin'), toggleSlot);

module.exports = router;
