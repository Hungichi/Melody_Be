const mongoose = require('mongoose');
const UserDetails = require('../src/models/UserDetails');
const jwt = require('jsonwebtoken');
let isConnected = false;
async function connectDB() { if (isConnected) return; await mongoose.connect(process.env.MONGODB_URI); isConnected = true; }

function getUserIdFromToken(req) {
  const auth = req.headers['authorization'];
  if (!auth) return null;
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch {
    return null;
  }
}

module.exports = async (req, res) => {
  await connectDB();
  if (req.method === 'PUT') {
    try {
      const userId = getUserIdFromToken(req);
      if (!userId) return res.status(401).json({ success: false, message: 'Thiếu hoặc sai token' });
      const updateFields = req.body;
      delete updateFields.userId;
      const detail = await UserDetails.findOneAndUpdate(
        { userId },
        { $set: updateFields },
        { new: true, runValidators: true }
      );
      if (!detail) return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin chi tiết user' });
      res.status(200).json({ success: true, data: detail });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}; 