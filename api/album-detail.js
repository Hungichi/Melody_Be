const mongoose = require('mongoose');
const Album = require('../src/models/Album');
let isConnected = false;
async function connectDB() { if (isConnected) return; await mongoose.connect(process.env.MONGODB_URI); isConnected = true; }

module.exports = async (req, res) => {
  await connectDB();
  if (req.method === 'GET') {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ success: false, message: 'Thiếu id album' });
      const album = await Album.findById(id)
        .populate('artist', 'username')
        .populate('songs');
      if (!album) return res.status(404).json({ success: false, message: 'Album không tồn tại' });
      // Tăng play count
      album.plays += 1;
      await album.save();
      res.json({ success: true, data: album });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}; 