const router = require('express').Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const {
  getStats,
  listUsers,
  getUser,
  updateUser,
  deleteUser,
} = require('../controllers/admin.controller');

// All admin endpoints require authentication and is_admin === true
router.use(requireAuth, requireAdmin);

router.get('/stats', getStats);
router.get('/users', listUsers);
router.get('/users/:id', getUser);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

module.exports = router;
