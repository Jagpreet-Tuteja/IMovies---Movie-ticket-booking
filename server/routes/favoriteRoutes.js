const express = require('express');
const favorites = require('../controllers/favoriteController');
const { fetchUser, userOnly } = require('../middlewares/fetchUser');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(fetchUser, userOnly);
router.get('/', asyncHandler(favorites.mine));
router.post('/:movieId', asyncHandler(favorites.add));
router.delete('/:movieId', asyncHandler(favorites.remove));

module.exports = router;
