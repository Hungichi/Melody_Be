const mongoose = require('mongoose');
const Album = require('../src/models/Album');
let isConnected = false;
async function connectDB() { if (isConnected) return; await mongoose.connect(process.env.MONGODB_URI); isConnected = true; }

module.exports = async (req, res) => {
  await connectDB();
  if (req.method === 'POST') {
    try {
      const { albumId, userId } = req.body;
      if (!albumId || !userId) return res.status(400).json({ success: false, message: 'Thiếu albumId hoặc userId.' });
      const album = await Album.findById(albumId);
      if (!album) return res.status(404).json({ success: false, message: 'Album không tồn tại' });
      const index = album.likes.indexOf(userId);
      if (index === -1) {
        album.likes.push(userId);
      } else {
        album.likes.splice(index, 1);
      }
      await album.save();
      res.json({ success: true, data: album });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}; 