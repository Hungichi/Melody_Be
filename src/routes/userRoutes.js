const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getUserDetail, updateUserDetail, getAllArtists, getArtistDetailById } = require('../controllers/userController');

router.get('/me/detail', protect, getUserDetail);
router.put('/me/detail', protect, updateUserDetail);
router.get('/artists', getAllArtists);
router.get('/artists/:id', getArtistDetailById);

module.exports = router; 