const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./users.routes'));
router.use('/areas', require('./areas.routes'));
router.use('/turfs', require('./turfs.routes'));
router.use('/fields', require('./fields.routes'));
router.use('/slots', require('./slots.routes'));
router.use('/bookings', require('./bookings.routes'));
router.use('/payments', require('./payments.routes'));
router.use('/products', require('./products.routes'));
router.use('/orders', require('./orders.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/settings', require('./settings.routes'));

module.exports = router;
