const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { register, login, refresh } = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', requireAuth, refresh);

module.exports = router;
