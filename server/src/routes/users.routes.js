const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const {
  getMe,
  updateMe,
  becomeOrganizer,
  becomeSeller,
  becomeCustomer,
  getWishlist,
  addWishlist,
  removeWishlist,
} = require('../controllers/users.controller');

router.use(requireAuth); // every route below requires a logged-in user

router.get('/me', getMe);
router.patch('/me', updateMe);

router.get('/me/wishlist', getWishlist);
router.post('/me/wishlist/:productId', addWishlist);
router.delete('/me/wishlist/:productId', removeWishlist);

// Adding a role re-issues nothing automatically — call POST /api/auth/login
// again (or refresh the token endpoint, left as an exercise) to get an
// updated JWT with the new role included.
router.post('/me/roles/organizer', becomeOrganizer);
router.post('/me/roles/seller', becomeSeller);
router.post('/me/roles/customer', becomeCustomer);

module.exports = router;
