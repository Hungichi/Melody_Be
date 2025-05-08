const mongoose = require('mongoose');
const ArtistRequest = require('../src/models/ArtistRequest');
const User = require('../src/models/User');
let isConnected = false;
async function connectDB() { if (isConnected) return; await mongoose.connect(process.env.MONGODB_URI); isConnected = true; }
module.exports = async (req, res) => {
  await connectDB();
  if (req.method === 'PATCH') {
    try {
      const { requestId, status } = req.body;
      if (!requestId || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Thiếu requestId hoặc status không hợp lệ' });
      }
      const request = await ArtistRequest.findByIdAndUpdate(
        requestId,
        { status, updatedAt: Date.now() },
        { new: true }
      );
      if (!request) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });
      }
      // Nếu duyệt, cập nhật role và stageName cho user
      if (status === 'approved') {
        const user = await User.findById(request.userId);
        if (user) {
          user.role = 'artist';
          user.stageName = request.stageName;
          await user.save();
        }
      }
      res.status(200).json({ success: true, data: request });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}; 