const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  createBooking,
  listMyBookings,
  listBookingsForMyTurfs,
  cancelBooking,
  confirmBooking,
  collectBookingCash,
  addTurfReview,
} = require('../controllers/bookings.controller');

router.use(requireAuth);

router.post('/', requireRole('customer'), createBooking);
router.get('/mine', requireRole('customer'), listMyBookings);
router.get('/for-my-turfs', requireRole('organizer'), listBookingsForMyTurfs);
router.patch('/:id/cancel', requireRole('customer'), cancelBooking);
router.patch('/:id/confirm', requireRole('organizer'), confirmBooking);
router.patch('/:id/collect-cash', requireRole('organizer'), collectBookingCash);
router.post('/:id/review', requireRole('customer'), addTurfReview);

module.exports = router;
