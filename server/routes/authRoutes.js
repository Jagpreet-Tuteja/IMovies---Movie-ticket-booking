const express = require('express');
const auth = require('../controllers/authController');
const { fetchUser, userOnly } = require('../middlewares/fetchUser');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/register', asyncHandler(auth.register));
router.post('/login', asyncHandler(auth.login));
router.post('/logout', auth.logout);
router.get('/me', fetchUser, auth.me);
router.put('/me', fetchUser, userOnly, asyncHandler(auth.updateProfile));

module.exports = router;
