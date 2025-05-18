const mongoose = require('mongoose');
const Album = require('../src/models/Album');
let isConnected = false;
async function connectDB() { if (isConnected) return; await mongoose.connect(process.env.MONGODB_URI); isConnected = true; }

module.exports = async (req, res) => {
  await connectDB();
  if (req.method === 'GET') {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const genre = req.query.genre;
      const search = req.query.search;
      const sort = req.query.sort || '-createdAt';
      let query = {};
      if (genre) query.genre = genre;
      if (search) query.$text = { $search: search };
      const albums = await Album.find(query)
        .populate('artist', 'username')
        .populate('songs')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit);
      const total = await Album.countDocuments(query);
      res.json({
        success: true,
        data: albums,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}; 