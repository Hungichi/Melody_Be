const mongoose = require('mongoose');
const ArtistRequest = require('../src/models/ArtistRequest');
let isConnected = false;
async function connectDB() { if (isConnected) return; await mongoose.connect(process.env.MONGODB_URI); isConnected = true; }
module.exports = async (req, res) => {
  await connectDB();
  if (req.method === 'GET') {
    try {
      const userId = req.query.userId || req.headers['x-user-id'];
      if (!userId) {
        return res.status(400).json({ success: false, message: 'Thiếu userId' });
      }
      const request = await ArtistRequest.findOne({ userId }).sort({ createdAt: -1 });
      res.status(200).json({ success: true, data: request });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}; 