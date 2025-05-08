const mongoose = require('mongoose');
const Song = require('../src/models/Song');
const Playlist = require('../src/models/Playlist');
const User = require('../src/models/User');
let isConnected = false;
async function connectDB() { if (isConnected) return; await mongoose.connect(process.env.MONGODB_URI); isConnected = true; }
module.exports = async (req, res) => {
  await connectDB();
  if (req.method === 'POST') {
    try {
      const { userId, songId } = req.body;
      if (!userId || !songId) return res.status(400).json({ success: false, message: 'Thiếu userId hoặc songId' });
      const user = await User.findById(userId).populate('playlists');
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      // Tìm hoặc tạo playlist Yêu thích
      let favorite = user.playlists.find(p => p.name === 'Yêu thích');
      if (!favorite) {
        favorite = await Playlist.create({ name: 'Yêu thích', user: user._id, songs: [] });
        user.playlists.push(favorite._id);
        await user.save();
      } else if (favorite._id) {
        favorite = await Playlist.findById(favorite._id);
      }

      // Like/dislike logic
      const idx = favorite.songs.findIndex(id => id.toString() === songId);
      let liked;
      if (idx === -1) {
        favorite.songs.push(songId);
        liked = true;
      } else {
        favorite.songs.splice(idx, 1);
        liked = false;
      }
      await favorite.save();
      res.status(200).json({ success: true, liked, data: favorite });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
};