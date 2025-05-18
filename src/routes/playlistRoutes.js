const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createPlaylist,
  getMyPlaylists,
  addSongToPlaylist,
  removeSongFromPlaylist,
  deleteMyPlaylist
} = require('../controllers/playlistController');

// Yêu cầu đăng nhập cho tất cả route
router.use(protect);

// Tạo playlist mới
router.post('/', createPlaylist);
// Lấy tất cả playlist của user
router.get('/mine', getMyPlaylists);
// Thêm bài hát vào playlist
router.post('/:playlistId/add-song', addSongToPlaylist);
// Xóa bài hát khỏi playlist
router.post('/:playlistId/remove-song', removeSongFromPlaylist);
// Xóa playlist của user
router.delete('/:playlistId', deleteMyPlaylist);

module.exports = router; 