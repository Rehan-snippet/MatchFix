const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { listSlots, createSlot, generateSlots } = require('../controllers/slots.controller');

router.get('/', listSlots);
router.post('/', requireAuth, requireRole('organizer'), createSlot);
router.post('/generate', requireAuth, requireRole('organizer'), generateSlots);

module.exports = router;
