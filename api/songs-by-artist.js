const mongoose = require('mongoose');
const Song = require('../src/models/Song');
const User = require('../src/models/User');
let isConnected = false;
async function connectDB() { if (isConnected) return; await mongoose.connect(process.env.MONGODB_URI); isConnected = true; }
module.exports = async (req, res) => {
  await connectDB();
  if (req.method === 'GET') {
    try {
      const { artist } = req.query;
      const artists = await User.find({ stageName: { $regex: artist, $options: 'i' } }).select('_id');
      if (!artists.length) return res.status(200).json({ success: true, data: [] });
      const songs = await Song.find({ artist: { $in: artists.map(a => a._id) } });
      res.status(200).json({ success: true, data: songs });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}; 