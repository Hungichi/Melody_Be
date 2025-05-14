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