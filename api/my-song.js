const mongoose = require('mongoose');
const Song = require('../src/models/Song');
const jwt = require('jsonwebtoken');
let isConnected = false;
async function connectDB() { if (isConnected) return; await mongoose.connect(process.env.MONGODB_URI); isConnected = true; }

function getUserIdFromToken(req) {
  const auth = req.headers['authorization'];
  if (!auth) return null;
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch {
    return null;
  }
}

module.exports = async (req, res) => {
  await connectDB();
  if (req.method === 'GET') {
    try {
      // Lấy id từ token hoặc query
      const artistId = req.query.artistId || getUserIdFromToken(req);
      if (!artistId) return res.status(400).json({ success: false, message: 'Thiếu artistId hoặc token' });
      const songs = await Song.find({ artist: artistId });
      res.status(200).json({ success: true, data: songs });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}; 