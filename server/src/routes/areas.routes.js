const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  listAreas,
  getArea,
  createArea,
  updateArea,
  deleteArea,
} = require('../controllers/areas.controller');

router.get('/', listAreas);
router.get('/:id', getArea);
router.post('/', requireAuth, requireRole('organizer'), createArea);
router.patch('/:id', requireAuth, requireRole('organizer'), updateArea);
router.delete('/:id', requireAuth, requireRole('organizer'), deleteArea);

module.exports = router;
