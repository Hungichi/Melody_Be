const mongoose = require('mongoose');
const ArtistRequest = require('../src/models/ArtistRequest');
let isConnected = false;
async function connectDB() { if (isConnected) return; await mongoose.connect(process.env.MONGODB_URI); isConnected = true; }
module.exports = async (req, res) => {
  await connectDB();
  if (req.method === 'GET') {
    try {
      const requests = await ArtistRequest.find().sort({ createdAt: -1 });
      res.status(200).json({ success: true, data: requests });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}; 