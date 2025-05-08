const mongoose = require('mongoose');
const Playlist = require('../src/models/Playlist');
const User = require('../src/models/User');
let isConnected = false;
async function connectDB() { if (isConnected) return; await mongoose.connect(process.env.MONGODB_URI); isConnected = true; }
module.exports = async (req, res) => {
  await connectDB();
  if (req.method === 'GET') {
    try {
      const userId = req.query.userId || req.headers['x-user-id'];
      if (!userId) return res.status(400).json({ success: false, message: 'Thiếu userId' });
      const user = await User.findById(userId).populate({ path: 'playlists', populate: { path: 'songs' } });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      const favorite = user.playlists.find(p => p.name === 'Yêu thích');
      if (!favorite) return res.status(404).json({ success: false, message: 'Chưa có playlist Yêu thích' });
      res.status(200).json({ success: true, data: favorite });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
};