const Song = require('../models/Song');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const User = require('../models/User');
const Playlist = require('../models/Playlist');

// Upload file to Cloudinary
const uploadToCloudinary = async (file, options = {}) => {
    try {
        const result = await cloudinary.uploader.upload(file.path, {
            resource_type: 'auto',
            ...options
        });
        // Xóa file tạm
        fs.unlink(file.path, (err) => {
            if (err) console.error('Error deleting temp file:', err);
        });
        return result.secure_url;
    } catch (error) {
        throw new Error(`Error uploading to Cloudinary: ${error.message}`);
    }
};

// Get all songs with filters and pagination
exports.getAllSongs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const genre = req.query.genre;
        const search = req.query.search;
        const sort = req.query.sort || '-createdAt';

        let query = {};

        // Apply filters
        if (genre) {
            query.genre = genre;
        }

        if (search) {
            query.$text = { $search: search };
        }

        // Execute query with pagination
        const songs = await Song.find(query)
            .populate('artist', 'username')
            .populate('album', 'title')
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit);

        // Get total count for pagination
        const total = await Song.countDocuments(query);

        res.json({
            success: true,
            data: songs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get single song
exports.getSong = async (req, res) => {
    try {
        const song = await Song.findById(req.params.id)
            .populate('artist', 'username')
            .populate('album', 'title')
            .populate('comments.user', 'username');

        if (!song) {
            return res.status(404).json({
                success: false,
                message: 'Song not found',
            });
        }

        // Increment play count
        song.plays += 1;
        await song.save();

        res.json({
            success: true,
            data: song,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Test upload song
exports.testUploadSong = async (req, res) => {
    try {
        console.log('Files received:', req.files);
        console.log('Body received:', req.body);

        if (!req.files || !req.files.audioFile || !req.files.coverImage) {
            return res.status(400).json({ 
                success: false,
                message: 'Please upload both audio and cover image files' 
            });
        }

        // Log file details
        console.log('Audio file:', {
            name: req.files.audioFile.name,
            size: req.files.audioFile.size,
            mimetype: req.files.audioFile.mimetype
        });

        console.log('Cover image:', {
            name: req.files.coverImage.name,
            size: req.files.coverImage.size,
            mimetype: req.files.coverImage.mimetype
        });

        // Upload files to Cloudinary
        const audioUrl = await uploadToCloudinary(req.files.audioFile[0], {
            folder: 'songs/audio',
            resource_type: 'video' // Cloudinary uses 'video' type for audio files
        });

        const coverImageUrl = await uploadToCloudinary(req.files.coverImage[0], {
            folder: 'songs/covers',
            width: 500,
            height: 500,
            crop: 'fill'
        });

        // Create song
        const song = await Song.create({
            title: req.body.title,
            artist: req.user._id,
            genre: req.body.genre,
            description: req.body.description,
            audioUrl,
            coverImage: coverImageUrl
        });

        res.status(201).json({
            success: true,
            data: song
        });
    } catch (error) {
        console.error('Error in test upload:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Create a new song
exports.createSong = async (req, res) => {
    try {
        console.log('Files received:', req.files);
        console.log('Body received:', req.body);

        if (!req.files || !req.files.audioFile || !req.files.coverImage) {
            return res.status(400).json({ 
                success: false,
                message: 'Please upload both audio and cover image files' 
            });
        }

        // Validate required fields
        if (!req.body.title || !req.body.genre || !req.body.duration) {
            return res.status(400).json({
                success: false,
                message: 'Please provide title, genre and duration'
            });
        }

        // Upload files to Cloudinary
        const audioUrl = await uploadToCloudinary(req.files.audioFile[0], {
            folder: 'songs/audio',
            resource_type: 'video' // Cloudinary uses 'video' type for audio files
        });

        const coverImageUrl = await uploadToCloudinary(req.files.coverImage[0], {
            folder: 'songs/covers',
            width: 500,
            height: 500,
            crop: 'fill'
        });

        // Create song
        const song = await Song.create({
            title: req.body.title,
            artist: req.user._id,
            genre: req.body.genre,
            description: req.body.description || '',
            duration: req.body.duration,
            audioUrl,
            coverImage: coverImageUrl
        });

        res.status(201).json({
            success: true,
            data: song
        });
    } catch (error) {
        console.error('Error in createSong:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join('. ')
            });
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update song
exports.updateSong = async (req, res) => {
    try {
        let song = await Song.findById(req.params.id);

        if (!song) {
            return res.status(404).json({
                success: false,
                message: 'Song not found'
            });
        }

        // Check ownership
        if (song.artist.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this song'
            });
        }

        // Handle file uploads if any
        if (req.files) {
            if (req.files.audioFile) {
                song.audioUrl = await uploadToCloudinary(req.files.audioFile[0], {
                    folder: 'songs/audio',
                    resource_type: 'video' // Cloudinary uses 'video' type for audio files
                });
            }
            if (req.files.coverImage) {
                song.coverImageUrl = await uploadToCloudinary(req.files.coverImage[0], {
                    folder: 'songs/covers',
                    width: 500,
                    height: 500,
                    crop: 'fill'
                });
            }
        }

        // Update other fields
        song = await Song.findByIdAndUpdate(
            req.params.id,
            { ...req.body, ...song },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: song
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete song
exports.deleteSong = async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);

        if (!song) {
            return res.status(404).json({
                success: false,
                message: 'Song not found'
            });
        }

        // Check ownership
        if (song.artist.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this song'
            });
        }

        await song.remove();

        res.status(200).json({
            success: true,
            message: 'Song deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Toggle like
exports.toggleLike = async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);
        if (!song) {
            return res.status(404).json({
                success: false,
                message: 'Song not found'
            });
        }

        const user = await User.findById(req.user._id).populate('playlists');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Tìm playlist "Yêu thích" của user, nếu chưa có thì tạo mới
        let favoritePlaylist = user.playlists.find(p => p.name === 'Yêu thích');
        if (!favoritePlaylist) {
            favoritePlaylist = await Playlist.create({
                name: 'Yêu thích',
                user: user._id,
                songs: []
            });
            user.playlists.push(favoritePlaylist._id);
            await user.save();
        } else if (favoritePlaylist._id) {
            // Nếu lấy từ populate thì là object, cần refetch để thao tác
            favoritePlaylist = await Playlist.findById(favoritePlaylist._id);
        }

        // Check if user already liked the song
        const likeIndex = song.likes.indexOf(req.user._id);
        const songIndexInPlaylist = favoritePlaylist.songs.findIndex(sid => sid.toString() === song._id.toString());
        let liked;
        if (likeIndex === -1) {
            song.likes.push(req.user._id);
            liked = true;
            // Thêm vào playlist nếu chưa có
            if (songIndexInPlaylist === -1) {
                favoritePlaylist.songs.push(song._id);
            }
        } else {
            song.likes.splice(likeIndex, 1);
            liked = false;
            // Xóa khỏi playlist nếu có
            if (songIndexInPlaylist !== -1) {
                favoritePlaylist.songs.splice(songIndexInPlaylist, 1);
            }
        }
        await song.save();
        await favoritePlaylist.save();

        res.status(200).json({
            success: true,
            liked,
            data: song
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Add comment
exports.addComment = async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);

        if (!song) {
            return res.status(404).json({
                success: false,
                message: 'Song not found'
            });
        }

        const comment = {
            user: req.user._id,
            text: req.body.text
        };

        song.comments.push(comment);
        await song.save();

        res.status(201).json({
            success: true,
            data: song
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get trending songs
exports.getTrendingSongs = async (req, res) => {
    try {
        const songs = await Song.find()
            .populate('artist', 'username')
            .sort('-likes -createdAt')
            .limit(10);

        res.status(200).json({
            success: true,
            data: songs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// API tìm kiếm nhạc
exports.searchSongs = async (req, res) => {
  try {
    const { title, artist, genre, page = 1, limit = 10 } = req.query;
    
    console.log('Search params:', { title, artist, genre, page, limit });
    
    // Xây dựng query dựa trên các tiêu chí tìm kiếm
    let query = {};
    
    // Tìm theo tên bài hát (không phân biệt hoa thường và dấu)
    if (title) {
      query.title = { 
        $regex: title, 
        $options: 'i'
      };
    }
    
    // Tìm theo nghệ sĩ
    if (artist) {
      // Đầu tiên tìm các user có stageName match với từ khóa
      const artists = await User.find({
        stageName: { $regex: artist, $options: 'i' }
      }).select('_id');
      
      // Thêm điều kiện tìm bài hát của các nghệ sĩ này
      if (artists.length > 0) {
        query.artist = { $in: artists.map(a => a._id) };
      } else {
        // Nếu không tìm thấy nghệ sĩ nào, trả về mảng rỗng luôn
        return res.status(200).json({
          success: true,
          message: 'Tìm kiếm thành công',
          data: {
            songs: [],
            pagination: {
              currentPage: parseInt(page),
              totalPages: 0,
              totalItems: 0,
              hasNext: false,
              hasPrev: false,
              limit: parseInt(limit)
            }
          }
        });
      }
    }
    
    // Tìm theo thể loại
    if (genre) {
      if (Array.isArray(genre)) {
        query.genre = { $in: genre };
      } else {
        query.genre = { 
          $regex: genre, 
          $options: 'i'
        };
      }
    }

    console.log('Final query:', JSON.stringify(query, null, 2));

    // Tính toán số lượng bản ghi cần bỏ qua cho phân trang
    const skip = (page - 1) * limit;

    // Thực hiện tìm kiếm với phân trang
    const songs = await Song.find(query)
      .populate('artist', 'username stageName avatar')
      .select('title artist genre duration releaseDate coverImageUrl plays likes comments')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ releaseDate: -1 });

    // Đếm tổng số kết quả
    const total = await Song.countDocuments(query);

    console.log(`Found ${songs.length} songs`);

    res.status(200).json({
      success: true,
      message: 'Tìm kiếm thành công',
      data: {
        songs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error in searchSongs:', error);
    res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi tìm kiếm bài hát'
    });
  }
};

// API lấy danh sách thể loại nhạc
exports.getGenres = async (req, res) => {
  try {
    // Lấy danh sách unique genres từ tất cả các bài hát
    const genres = await Song.distinct('genre');
    
    res.status(200).json({
      success: true,
      data: genres
    });
  } catch (error) {
    console.error('Error in getGenres:', error);
    res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi lấy danh sách thể loại'
    });
  }
};

// Lấy playlist "Yêu thích" của user hiện tại
exports.getFavoritePlaylist = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate({
            path: 'playlists',
            populate: { path: 'songs', select: 'title artist coverImageUrl' }
        });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        let favoritePlaylist = user.playlists.find(p => p.name === 'Yêu thích');
        if (!favoritePlaylist) {
            return res.status(404).json({ success: false, message: 'Bạn chưa có playlist Yêu thích' });
        }
        res.status(200).json({
            success: true,
            data: favoritePlaylist
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
