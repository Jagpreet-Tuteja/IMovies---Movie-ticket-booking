const express = require('express');
const admin = require('../controllers/adminController');
const { fetchUser, adminOnly } = require('../middlewares/fetchUser');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/login', asyncHandler(admin.login));

// Everything below needs an admin token
router.use(fetchUser, adminOnly);
router.get('/stats', asyncHandler(admin.stats));
router.get('/users', asyncHandler(admin.users));
router.get('/bookings', asyncHandler(admin.bookings));
router.patch('/bookings/:id/cancel', asyncHandler(admin.cancelBooking));
router.get('/payments', asyncHandler(admin.payments));

module.exports = router;
