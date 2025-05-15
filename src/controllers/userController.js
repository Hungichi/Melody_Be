const UserDetails = require('../models/UserDetails');

// Lấy thông tin UserDetails của user đang đăng nhập
exports.getUserDetail = async (req, res) => {
  try {
    const userId = req.user._id;
    const detail = await UserDetails.findOne({ userId });
    if (!detail) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin chi tiết user' });
    }
    res.status(200).json({ success: true, data: detail });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật thông tin UserDetails của user đang đăng nhập
exports.updateUserDetail = async (req, res) => {
  try {
    const userId = req.user._id;
    const updateFields = req.body;
    // Không cho update userId
    delete updateFields.userId;
    const detail = await UserDetails.findOneAndUpdate(
      { userId },
      { $set: updateFields },
      { new: true, runValidators: true }
    );
    if (!detail) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin chi tiết user' });
    }
    res.status(200).json({ success: true, data: detail });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy danh sách tất cả artist
exports.getAllArtists = async (req, res) => {
  try {
    const User = require('../models/User');
    const artists = await User.find({ role: 'artist' }).select('-password');
    res.status(200).json({ success: true, data: artists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy thông tin chi tiết artist theo id (userId), bao gồm userDetail, album và bài hát
exports.getArtistDetailById = async (req, res) => {
  try {
    const userId = req.params.id;
    const UserDetails = require('../models/UserDetails');
    const Album = require('../models/Album');
    const Song = require('../models/Song');

    // Lấy user detail
    const userDetail = await UserDetails.findOne({ userId });
    // Lấy album của artist
    const albums = await Album.find({ artist: userId });
    // Lấy bài hát của artist
    const songs = await Song.find({ artist: userId });

    res.status(200).json({
      success: true,
      data: {
        userDetail,
        albums,
        songs
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}; 