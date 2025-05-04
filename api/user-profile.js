const mongoose = require('mongoose');
const User = require('../src/models/User');
let isConnected = false;
async function connectDB() { if (isConnected) return; await mongoose.connect(process.env.MONGODB_URI); isConnected = true; }
module.exports = async (req, res) => {
  await connectDB();
  if (req.method === 'GET') {
    try {
      // Lấy userId từ query hoặc header (tùy FE truyền lên)
      const userId = req.query.userId || req.headers['x-user-id'];
      if (!userId) {
        return res.status(400).json({ success: false, message: 'Thiếu userId' });
      }
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
      }
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}; 