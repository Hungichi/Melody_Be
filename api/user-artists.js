const mongoose = require('mongoose');
const User = require('../src/models/User');
const Album = require('../src/models/Album');
let isConnected = false;
async function connectDB() { if (isConnected) return; await mongoose.connect(process.env.MONGODB_URI); isConnected = true; }

module.exports = async (req, res) => {
  await connectDB();
  if (req.method === 'GET') {
    try {
      const userId = req.query.id;
      if (userId) {
        // Lấy chi tiết 1 artist kèm albums
        const user = await User.findById(userId).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'Artist not found' });
        const albums = await Album.find({ artist: userId });
        return res.status(200).json({
          success: true,
          data: { ...user.toObject(), albums }
        });
      } else {
        // Lấy tất cả artist kèm albums
        const artists = await User.find({ role: 'artist' }).select('-password');
        const artistsWithAlbums = await Promise.all(artists.map(async (artist) => {
          const albums = await Album.find({ artist: artist._id });
          return { ...artist.toObject(), albums };
        }));
        return res.status(200).json({ success: true, data: artistsWithAlbums });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}; 