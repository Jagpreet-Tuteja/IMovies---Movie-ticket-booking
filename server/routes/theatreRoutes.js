const express = require('express');
const theatres = require('../controllers/theatreController');
const { fetchUser, adminOnly } = require('../middlewares/fetchUser');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(theatres.list));
router.post('/', fetchUser, adminOnly, asyncHandler(theatres.create));
router.put('/:id', fetchUser, adminOnly, asyncHandler(theatres.update));
router.delete('/:id', fetchUser, adminOnly, asyncHandler(theatres.remove));

module.exports = router;
