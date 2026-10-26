const express = require('express');
const movies = require('../controllers/movieController');
const { fetchUser, adminOnly } = require('../middlewares/fetchUser');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(movies.list));
router.get('/filters', asyncHandler(movies.filters));
router.get('/:id', asyncHandler(movies.get));
router.get('/:id/shows', asyncHandler(movies.shows));

router.post('/', fetchUser, adminOnly, asyncHandler(movies.create));
router.put('/:id', fetchUser, adminOnly, asyncHandler(movies.update));
router.delete('/:id', fetchUser, adminOnly, asyncHandler(movies.remove));

module.exports = router;
