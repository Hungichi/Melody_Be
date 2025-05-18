const mongoose = require('mongoose');
const Song = require('../src/models/Song');
const User = require('../src/models/User');
const jwt = require('jsonwebtoken');
let isConnected = false;
async function connectDB() { if (isConnected) return; await mongoose.connect(process.env.MONGODB_URI); isConnected = true; }

function getUserFromToken(req) {
  const auth = req.headers['authorization'];
  if (!auth) return null;
  const token = auth.split(' ')[1];
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

module.exports = async (req, res) => {
  await connectDB();
  if (req.method === 'DELETE') {
    try {
      const { songId } = req.query;
      if (!songId) return res.status(400).json({ success: false, message: 'Thiếu songId' });
      const user = getUserFromToken(req);
      if (!user) return res.status(401).json({ success: false, message: 'Thiếu hoặc sai token' });
      const song = await Song.findById(songId);
      if (!song) return res.status(404).json({ success: false, message: 'Song not found' });
      // Chỉ cho phép artist sở hữu hoặc admin xóa
      const userInfo = await User.findById(user.id);
      if (song.artist.toString() !== user.id && userInfo.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this song' });
      }
      await song.deleteOne();
      res.status(200).json({ success: true, message: 'Song deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}; 