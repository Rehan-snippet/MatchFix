const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { 
  register, 
  login, 
  refresh,
  getMe, 
  updateProfile, 
  changePassword 
} = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', requireAuth, refresh);
router.get('/me', requireAuth, getMe);
router.patch('/profile', requireAuth, updateProfile);
router.post('/change-password', requireAuth, changePassword);

module.exports = router;