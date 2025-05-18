const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
    createAlbum,
    getAllAlbums,
    getAlbum,
    updateAlbum,
    deleteAlbum,
    addSongToAlbum,
    removeSongFromAlbum,
    toggleLike
} = require('../controllers/albumController');

// Public routes
router.get('/', getAllAlbums);
router.get('/:id', getAlbum);

// Protected routes - Artist only
router.use(protect);
router.use(authorize('artist'));

// Artist only routes
router.post('/', upload, createAlbum);
router.put('/:id', upload, updateAlbum);
router.delete('/:id', deleteAlbum);

// Album song management
router.post('/:id/songs', addSongToAlbum);
router.delete('/:id/songs/:songId', removeSongFromAlbum);

// Like/Unlike album
router.post('/:id/like', toggleLike);

module.exports = router; 