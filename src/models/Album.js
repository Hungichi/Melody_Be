const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  genre: {
    type: String,
    required: [true, 'Genre is required'],
    enum: {
      values: [
        'Pop',
        'Rock',
        'Hip-Hop',
        'R&B',
        'Electronic',
        'Classical',
        'Jazz',
        'Country',
        'Folk',    
        'Blues',
        'Metal',
        'Indie',
        'K-Pop',
        'V-Pop',
        'World Music'
      ],
      message: '{VALUE} is not a valid genre'
    }
  },
  coverImage: {
    type: String,
    default: 'default-album-cover.jpg'
  },
  songs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
  }],
  releaseDate: {
    type: Date,
    default: Date.now
  },
  plays: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Add text index for search
albumSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Album', albumSchema); 