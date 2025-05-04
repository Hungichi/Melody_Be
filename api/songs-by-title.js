const mongoose = require('mongoose');
const Song = require('../src/models/Song');
let isConnected = false;
async function connectDB() { if (isConnected) return; await mongoose.connect(process.env.MONGODB_URI); isConnected = true; }
module.exports = async (req, res) => {
  await connectDB();
  if (req.method === 'GET') {
    try {
      const { title } = req.query;
      const songs = await Song.find({ title: { $regex: title, $options: 'i' } });
      res.status(200).json({ success: true, data: songs });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}; 