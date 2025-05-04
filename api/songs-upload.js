const mongoose = require('mongoose');
const Song = require('../src/models/Song');
const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;
const formidable = require('formidable');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
}

const streamUpload = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (result) resolve(result);
      else reject(error);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

module.exports = async (req, res) => {
  await connectDB();
  if (req.method === 'POST') {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(400).json({ success: false, message: 'Lỗi khi upload file.' });
      }
      try {
        const { title, artist, genre } = fields;
        const audioFile = files.audioFile;
        const coverImage = files.coverImage;
        if (!audioFile || !coverImage) {
          return res.status(400).json({ success: false, message: 'Thiếu file nhạc hoặc ảnh bìa.' });
        }
        // Đọc buffer từ file
        const audioBuffer = require('fs').readFileSync(audioFile.filepath);
        const coverBuffer = require('fs').readFileSync(coverImage.filepath);
        // Upload audio
        const audioResult = await streamUpload(audioBuffer, {
          folder: 'songs/audio',
          resource_type: 'video'
        });
        // Upload cover image
        const coverResult = await streamUpload(coverBuffer, {
          folder: 'songs/covers',
          width: 500,
          height: 500,
          crop: 'fill'
        });
        // Lưu vào DB
        const song = await Song.create({
          title,
          artist,
          genre,
          audioUrl: audioResult.secure_url,
          coverImageUrl: coverResult.secure_url
        });
        res.status(201).json({ success: true, data: song });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}; 