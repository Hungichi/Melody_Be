const Playlist = require('../models/Playlist');
const User = require('../models/User');
const Song = require('../models/Song');

// Tạo playlist mới
exports.createPlaylist = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Tên playlist là bắt buộc' });
        }
        const playlist = await Playlist.create({
            name,
            user: req.user._id,
            songs: []
        });
        // Thêm playlist vào user
        await User.findByIdAndUpdate(req.user._id, { $push: { playlists: playlist._id } });
        res.status(201).json({ success: true, data: playlist });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy tất cả playlist của user
exports.getMyPlaylists = async (req, res) => {
    try {
        const playlists = await Playlist.find({ user: req.user._id }).populate('songs', 'title artist coverImageUrl');
        res.status(200).json({ success: true, data: playlists });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Thêm bài hát vào playlist
exports.addSongToPlaylist = async (req, res) => {
    try {
        const { playlistId } = req.params;
        const { songId } = req.body;
        const playlist = await Playlist.findOne({ _id: playlistId, user: req.user._id });
        if (!playlist) {
            return res.status(404).json({ success: false, message: 'Playlist không tồn tại hoặc không thuộc về bạn' });
        }
        if (!songId) {
            return res.status(400).json({ success: false, message: 'Thiếu songId' });
        }
        if (playlist.songs.includes(songId)) {
            return res.status(400).json({ success: false, message: 'Bài hát đã có trong playlist' });
        }
        playlist.songs.push(songId);
        await playlist.save();
        res.status(200).json({ success: true, data: playlist });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Xóa bài hát khỏi playlist
exports.removeSongFromPlaylist = async (req, res) => {
    try {
        const { playlistId } = req.params;
        const { songId } = req.body;
        const playlist = await Playlist.findOne({ _id: playlistId, user: req.user._id });
        if (!playlist) {
            return res.status(404).json({ success: false, message: 'Playlist không tồn tại hoặc không thuộc về bạn' });
        }
        playlist.songs = playlist.songs.filter(id => id.toString() !== songId);
        await playlist.save();
        res.status(200).json({ success: true, data: playlist });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}; 