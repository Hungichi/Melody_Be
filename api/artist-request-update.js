const mongoose = require('mongoose');
const ArtistRequest = require('../src/models/ArtistRequest');
let isConnected = false;
async function connectDB() { if (isConnected) return; await mongoose.connect(process.env.MONGODB_URI); isConnected = true; }
module.exports = async (req, res) => {
  await connectDB();
  if (req.method === 'PUT') {
    try {
      const { requestId, stageName, email, phone, bio, profileImageUrl, userId } = req.body;
      if (!requestId || !stageName || !email || !phone || !bio || !profileImageUrl || !userId) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin cập nhật' });
      }
      const existingRequest = await ArtistRequest.findOne({ _id: requestId, userId });
      if (!existingRequest) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu hoặc không có quyền cập nhật' });
      }
      // Chỉ cho phép cập nhật nếu request đang ở trạng thái pending
      if (existingRequest.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Chỉ có thể cập nhật yêu cầu đang chờ duyệt' });
      }
      // Kiểm tra email có khớp với email của user
      if (email !== existingRequest.email) {
        return res.status(400).json({ success: false, message: 'Email phải trùng với email tài khoản của bạn' });
      }
      const updatedRequest = await ArtistRequest.findByIdAndUpdate(
        requestId,
        { stageName, email, phone, bio, profileImageUrl, updatedAt: Date.now() },
        { new: true, runValidators: true }
      );
      res.status(200).json({ success: true, data: updatedRequest });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}; 