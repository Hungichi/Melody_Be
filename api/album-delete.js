const mongoose = require('mongoose');
const Album = require('../src/models/Album');
let isConnected = false;
async function connectDB() { if (isConnected) return; await mongoose.connect(process.env.MONGODB_URI); isConnected = true; }

module.exports = async (req, res) => {
  await connectDB();
  if (req.method === 'DELETE') {
    try {
      const { id, artist } = req.body;
      if (!id || !artist) return res.status(400).json({ success: false, message: 'Thiếu id hoặc artist.' });
      const album = await Album.findById(id);
      if (!album) return res.status(404).json({ success: false, message: 'Album không tồn tại' });
      if (album.artist.toString() !== artist) {
        return res.status(403).json({ success: false, message: 'Không có quyền xóa album này' });
      }
      await album.deleteOne();
      res.json({ success: true, message: 'Album deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}; 