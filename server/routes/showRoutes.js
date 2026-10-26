const express = require('express');
const shows = require('../controllers/showController');
const { fetchUser, optionalUser, userOnly, adminOnly } = require('../middlewares/fetchUser');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', fetchUser, adminOnly, asyncHandler(shows.list));
router.get('/:id', asyncHandler(shows.get));
router.get('/:id/seats', optionalUser, asyncHandler(shows.seatMap));

// Temporary seat holds while the user pays
router.post('/:id/lock', fetchUser, userOnly, asyncHandler(shows.lockSeats));
router.delete('/:id/lock', fetchUser, userOnly, asyncHandler(shows.releaseSeats));

router.post('/', fetchUser, adminOnly, asyncHandler(shows.create));
router.delete('/:id', fetchUser, adminOnly, asyncHandler(shows.remove));

module.exports = router;
