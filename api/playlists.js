const mongoose = require('mongoose');
const Playlist = require('../src/models/Playlist');
const User = require('../src/models/User');
const jwt = require('jsonwebtoken');
let isConnected = false;
async function connectDB() { if (isConnected) return; await mongoose.connect(process.env.MONGODB_URI); isConnected = true; }

function getUserIdFromToken(req) {
  const auth = req.headers['authorization'];
  if (!auth) return null;
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch {
    return null;
  }
}

module.exports = async (req, res) => {
  await connectDB();
  if (req.method === 'DELETE') {
    try {
      const { playlistId } = req.query;
      if (!playlistId) return res.status(400).json({ success: false, message: 'Thiếu playlistId' });
      const userId = getUserIdFromToken(req);
      if (!userId) return res.status(401).json({ success: false, message: 'Thiếu hoặc sai token' });
      const playlist = await Playlist.findOne({ _id: playlistId, user: userId });
      if (!playlist) return res.status(404).json({ success: false, message: 'Playlist không tồn tại hoặc không thuộc về bạn' });
      await playlist.deleteOne();
      await User.findByIdAndUpdate(userId, { $pull: { playlists: playlistId } });
      res.status(200).json({ success: true, message: 'Xóa playlist thành công' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}; 