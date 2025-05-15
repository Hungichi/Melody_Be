const mongoose = require('mongoose');
const UserDetails = require('../src/models/UserDetails');
const Album = require('../src/models/Album');
const Song = require('../src/models/Song');
let isConnected = false;
async function connectDB() { if (isConnected) return; await mongoose.connect(process.env.MONGODB_URI); isConnected = true; }

module.exports = async (req, res) => {
  await connectDB();
  if (req.method === 'GET') {
    try {
      const userId = req.query.id;
      if (!userId) return res.status(400).json({ success: false, message: 'Thiếu id artist' });
      const userDetail = await UserDetails.findOne({ userId });
      const albums = await Album.find({ artist: userId });
      const songs = await Song.find({ artist: userId });
      res.status(200).json({
        success: true,
        data: {
          userDetail,
          albums,
          songs
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}; 