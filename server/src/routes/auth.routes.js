const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  refreshToken,
} = require('../controllers/auth.controller');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', requireAuth, getMe);
router.patch('/profile', requireAuth, updateProfile);
router.post('/change-password', authLimiter, requireAuth, changePassword);
router.post('/refresh', requireAuth, refreshToken);

module.exports = router;