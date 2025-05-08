const mongoose = require('mongoose');
const Playlist = require('../src/models/Playlist');
let isConnected = false;
async function connectDB() { if (isConnected) return; await mongoose.connect(process.env.MONGODB_URI); isConnected = true; }
module.exports = async (req, res) => {
  await connectDB();
  if (req.method === 'POST') {
    try {
      const { playlistId, songId } = req.body;
      if (!playlistId || !songId) return res.status(400).json({ success: false, message: 'Thiếu playlistId hoặc songId' });
      const playlist = await Playlist.findById(playlistId);
      if (!playlist) return res.status(404).json({ success: false, message: 'Playlist không tồn tại' });
      if (playlist.songs.includes(songId)) return res.status(400).json({ success: false, message: 'Bài hát đã có trong playlist' });
      playlist.songs.push(songId);
      await playlist.save();
      res.status(200).json({ success: true, data: playlist });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
};