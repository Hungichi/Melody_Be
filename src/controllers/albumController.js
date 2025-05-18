const Album = require('../models/Album');
const Song = require('../models/Song');
const cloudinary = require('../config/cloudinary');

// @desc    Create a new album
// @route   POST /api/albums
// @access  Private (Artist only)
exports.createAlbum = async (req, res) => {
    try {
        const { title, description, genre, releaseDate } = req.body;
        
        // Handle cover image upload
        let coverImageUrl = '';
        if (req.files && req.files.coverImage) {
            const result = await cloudinary.uploader.upload(req.files.coverImage.tempFilePath, {
                folder: 'albums',
                resource_type: 'auto'
            });
            coverImageUrl = result.secure_url;
        }

        const album = await Album.create({
            title,
            description,
            genre,
            releaseDate,
            coverImage: coverImageUrl,
            artist: req.user._id
        });

        res.status(201).json({
            success: true,
            data: album
        });
    } catch (error) {
        console.error('Create album error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating album',
            error: error.message
        });
    }
};

// Get all albums with filters and pagination
exports.getAllAlbums = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const genre = req.query.genre;
        const search = req.query.search;
        const sort = req.query.sort || '-createdAt';

        let query = {};

        if (genre) {
            query.genre = genre;
        }

        if (search) {
            query.$text = { $search: search };
        }

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
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get single album
exports.getAlbum = async (req, res) => {
    try {
        const album = await Album.findById(req.params.id)
            .populate('artist', 'username')
            .populate('songs');

        if (!album) {
            return res.status(404).json({
                success: false,
                message: 'Album not found'
            });
        }

        // Increment play count
        album.plays += 1;
        await album.save();

        res.json({
            success: true,
            data: album
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update an album
// @route   PUT /api/albums/:id
// @access  Private (Artist only)
exports.updateAlbum = async (req, res) => {
    try {
        const { title, description, releaseDate } = req.body;
        const album = await Album.findById(req.params.id);

        if (!album) {
            return res.status(404).json({
                success: false,
                message: 'Album not found'
            });
        }

        // Check if user is the album owner
        if (album.artist.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this album'
            });
        }

        // Handle cover image upload
        if (req.files && req.files.coverImage) {
            const result = await cloudinary.uploader.upload(req.files.coverImage.tempFilePath, {
                folder: 'albums',
                resource_type: 'auto'
            });
            album.coverImage = result.secure_url;
        }

        // Update other fields
        if (title) album.title = title;
        if (description) album.description = description;
        if (releaseDate) album.releaseDate = releaseDate;

        await album.save();

        res.json({
            success: true,
            data: album
        });
    } catch (error) {
        console.error('Update album error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating album',
            error: error.message
        });
    }
};

// Delete album
exports.deleteAlbum = async (req, res) => {
    try {
        const album = await Album.findById(req.params.id);

        if (!album) {
            return res.status(404).json({
                success: false,
                message: 'Album not found'
            });
        }

        // Check ownership
        if (album.artist.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this album'
            });
        }

        await album.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Album deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Add song to album
exports.addSongToAlbum = async (req, res) => {
    try {
        const { songId } = req.body;
        const album = await Album.findById(req.params.id);

        if (!album) {
            return res.status(404).json({
                success: false,
                message: 'Album not found'
            });
        }

        // Check ownership
        if (album.artist.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to modify this album'
            });
        }

        // Check if song exists
        const song = await Song.findById(songId);
        if (!song) {
            return res.status(404).json({
                success: false,
                message: 'Song not found'
            });
        }

        // Check if song is already in album
        if (album.songs.includes(songId)) {
            return res.status(400).json({
                success: false,
                message: 'Song is already in this album'
            });
        }

        album.songs.push(songId);
        await album.save();

        res.status(200).json({
            success: true,
            data: album
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Remove song from album
exports.removeSongFromAlbum = async (req, res) => {
    try {
        const { songId } = req.params;
        const album = await Album.findById(req.params.id);

        if (!album) {
            return res.status(404).json({
                success: false,
                message: 'Album not found'
            });
        }

        // Check ownership
        if (album.artist.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to modify this album'
            });
        }

        // Remove song from album
        album.songs = album.songs.filter(song => song.toString() !== songId);
        await album.save();

        res.status(200).json({
            success: true,
            data: album
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Toggle like album
exports.toggleLike = async (req, res) => {
    try {
        const album = await Album.findById(req.params.id);

        if (!album) {
            return res.status(404).json({
                success: false,
                message: 'Album not found'
            });
        }

        // Check if user already liked the album
        const index = album.likes.indexOf(req.user._id);
        if (index === -1) {
            album.likes.push(req.user._id);
        } else {
            album.likes.splice(index, 1);
        }

        await album.save();

        res.status(200).json({
            success: true,
            data: album
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 