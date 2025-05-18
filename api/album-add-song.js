const mongoose = require('mongoose');
const Album = require('../src/models/Album');
const Song = require('../src/models/Song');
let isConnected = false;
async function connectDB() { if (isConnected) return; await mongoose.connect(process.env.MONGODB_URI); isConnected = true; }

module.exports = async (req, res) => {
  await connectDB();
  if (req.method === 'POST') {
    try {
      const { albumId, songId, artist } = req.body;
      if (!albumId || !songId || !artist) return res.status(400).json({ success: false, message: 'Thiếu albumId, songId hoặc artist.' });
      const album = await Album.findById(albumId);
      if (!album) return res.status(404).json({ success: false, message: 'Album không tồn tại' });
      if (album.artist.toString() !== artist) {
        return res.status(403).json({ success: false, message: 'Không có quyền sửa album này' });
      }
      const song = await Song.findById(songId);
      if (!song) return res.status(404).json({ success: false, message: 'Bài hát không tồn tại' });
      if (album.songs.includes(songId)) return res.status(400).json({ success: false, message: 'Bài hát đã có trong album' });
      album.songs.push(songId);
      await album.save();
      res.json({ success: true, data: album });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}; 