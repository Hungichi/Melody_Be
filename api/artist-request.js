const mongoose = require('mongoose');
const ArtistRequest = require('../src/models/ArtistRequest');
let isConnected = false;
async function connectDB() { if (isConnected) return; await mongoose.connect(process.env.MONGODB_URI); isConnected = true; }
module.exports = async (req, res) => {
  await connectDB();
  if (req.method === 'POST') {
    try {
      const { userId, stageName, email, phone, bio, profileImageUrl } = req.body;
      if (!userId || !stageName || !email || !phone || !bio || !profileImageUrl) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin request' });
      }
      const existing = await ArtistRequest.findOne({ userId, status: 'pending' });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Bạn đã có một yêu cầu đang chờ xử lý' });
      }
      const artistRequest = await ArtistRequest.create({ userId, stageName, email, phone, bio, profileImageUrl });
      res.status(201).json({ success: true, data: artistRequest });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}; 