const express = require('express');
const bookings = require('../controllers/bookingController');
const { fetchUser, userOnly } = require('../middlewares/fetchUser');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(fetchUser, userOnly);
router.post('/', asyncHandler(bookings.create));
router.get('/me', asyncHandler(bookings.mine));
router.get('/:id', asyncHandler(bookings.getOne));
router.patch('/:id/cancel', asyncHandler(bookings.cancel));

module.exports = router;
