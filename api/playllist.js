const mongoose = require('mongoose');
const Playlist = require('../src/models/Playlist');
const User = require('../src/models/User');
let isConnected = false;
async function connectDB() { if (isConnected) return; await mongoose.connect(process.env.MONGODB_URI); isConnected = true; }
module.exports = async (req, res) => {
  await connectDB();
  if (req.method === 'POST') {
    try {
      const { userId, name } = req.body;
      if (!userId || !name) return res.status(400).json({ success: false, message: 'Thiếu userId hoặc tên playlist' });
      const playlist = await Playlist.create({ name, user: userId, songs: [] });
      await User.findByIdAndUpdate(userId, { $push: { playlists: playlist._id } });
      res.status(201).json({ success: true, data: playlist });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else if (req.method === 'GET') {
    // Lấy tất cả playlist của user
    try {
      const userId = req.query.userId || req.headers['x-user-id'];
      if (!userId) return res.status(400).json({ success: false, message: 'Thiếu userId' });
      const playlists = await Playlist.find({ user: userId }).populate('songs');
      res.status(200).json({ success: true, data: playlists });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
};