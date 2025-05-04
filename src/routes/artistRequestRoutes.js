const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');

const { 
  createArtistRequest, 
  getAllRequests, 
  updateRequestStatus,
  getUserRequest,
  updateArtistRequest
} = require('../controllers/artistRequestController');

// Middleware xử lý upload và đẩy buffer lên Cloudinary
const handleUpload = async (req, res, next) => {
  upload.single('profileImage')(req, res, async function(err) {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng tải lên ảnh đại diện' });
    }
    // Upload buffer lên Cloudinary
    try {
      const streamUpload = () => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'profile_images', width: 400, height: 400, crop: 'fill', quality: 'auto' },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
      };
      const result = await streamUpload();
      req.file.cloudinaryUrl = result.secure_url;
      next();
    } catch (error) {
      return res.status(400).json({ success: false, message: 'Lỗi khi tải ảnh lên Cloudinary.' });
    }
  });
};

// Routes
router.post('/', protect, handleUpload, createArtistRequest);
router.get('/', protect, authorize('admin'), getAllRequests);
router.patch('/:requestId', protect, authorize('admin'), updateRequestStatus);
router.get('/me', protect, getUserRequest);
router.put('/:requestId', protect, handleUpload, updateArtistRequest);

module.exports = router; 