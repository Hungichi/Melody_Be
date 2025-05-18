const mongoose = require('mongoose');
const Album = require('../src/models/Album');
const User = require('../src/models/User');
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
        const { title, description, genre, releaseDate, artist } = fields;
        if (!title || !genre || !artist) {
          return res.status(400).json({ success: false, message: 'Thiếu title, genre hoặc artist.' });
        }
        // Kiểm tra artist hợp lệ
        const artistUser = await User.findById(artist);
        if (!artistUser || artistUser.role !== 'artist') {
          return res.status(403).json({ success: false, message: 'Artist không hợp lệ.' });
        }
        let coverImageUrl = undefined;
        if (files.coverImage) {
          const coverBuffer = require('fs').readFileSync(files.coverImage.filepath);
          const coverResult = await streamUpload(coverBuffer, {
            folder: 'albums/covers',
            width: 500,
            height: 500,
            crop: 'fill'
          });
          coverImageUrl = coverResult.secure_url;
        }
        const album = await Album.create({
          title,
          description,
          genre,
          releaseDate,
          coverImage: coverImageUrl,
          artist
        });
        res.status(201).json({ success: true, data: album });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}; 