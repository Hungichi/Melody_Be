const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getAllSongs,
    getSong,
    createSong,
    updateSong,
    deleteSong,
    toggleLike,
    addComment,
    getTrendingSongs,
    searchSongs,
    getGenres,
    getFavoritePlaylist,
} = require('../controllers/songController');

// Cấu hình multer cho upload song
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'audioFile') {
        // Chấp nhận audio files
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Please upload a valid audio file'), false);
        }
    } else if (file.fieldname === 'coverImage') {
        // Chấp nhận image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Please upload a valid image file'), false);
        }
    } else {
        cb(new Error('Unexpected field'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: fileFilter
});

// Middleware xử lý upload nhiều file
const uploadFields = upload.fields([
    { name: 'audioFile', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
]);

// Public routes
router.get('/search', searchSongs);
router.get('/genres', getGenres);
router.get('/trending', getTrendingSongs);
router.get('/', getAllSongs);

// Protected routes
router.use(protect);

// Lấy playlist yêu thích của user (phải đặt trước /:id)
router.get('/favorite-playlist', getFavoritePlaylist);

// Like and comment routes
router.post('/:id/like', toggleLike);
router.post('/:id/comments', addComment);

// Artist and admin routes
router.post('/', authorize('artist', 'admin'), uploadFields, createSong);
router.put('/:id', authorize('artist', 'admin'), uploadFields, updateSong);
router.delete('/:id', authorize('artist', 'admin'), deleteSong);

// Route này phải ở cuối cùng!
router.get('/:id', getSong);

module.exports = router;
