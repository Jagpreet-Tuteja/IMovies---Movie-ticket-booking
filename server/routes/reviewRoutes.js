const express = require('express');
const reviews = require('../controllers/reviewController');
const { fetchUser, userOnly, adminOnly } = require('../middlewares/fetchUser');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', fetchUser, adminOnly, asyncHandler(reviews.all));
router.get('/movie/:movieId', asyncHandler(reviews.forMovie));
router.post('/', fetchUser, userOnly, asyncHandler(reviews.upsert));
router.delete('/:id', fetchUser, asyncHandler(reviews.remove));

module.exports = router;
