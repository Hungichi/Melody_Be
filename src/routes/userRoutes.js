const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getUserDetail, updateUserDetail } = require('../controllers/userController');

router.get('/me/detail', protect, getUserDetail);
router.put('/me/detail', protect, updateUserDetail);

module.exports = router; 