const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  listTurfs,
  getTurf,
  createTurf,
  updateTurf,
  deleteTurf,
  addTurfImage,
  deleteTurfImage,
} = require('../controllers/turfs.controller');

router.get('/', listTurfs);
router.get('/:id', getTurf);

router.post('/', requireAuth, requireRole('organizer'), createTurf);
router.patch('/:id', requireAuth, requireRole('organizer'), updateTurf);
router.delete('/:id', requireAuth, requireRole('organizer'), deleteTurf);

router.post('/:id/images', requireAuth, requireRole('organizer'), addTurfImage);
router.delete('/:turfId/images/:imageId', requireAuth, requireRole('organizer'), deleteTurfImage);

module.exports = router;
