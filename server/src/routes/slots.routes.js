const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { listSlots, generateSlots } = require('../controllers/slots.controller');

router.get('/', listSlots);
router.post('/generate', requireAuth, requireRole('organizer'), generateSlots);

module.exports = router;
