const mongoose = require('mongoose');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');
let isConnected = false;
async function connectDB() { if (isConnected) return; await mongoose.connect(process.env.MONGODB_URI); isConnected = true; }
module.exports = async (req, res) => {
  await connectDB();
  if (req.method === 'POST') {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin đăng ký' });
      }
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email đã tồn tại' });
      }
      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({ username, email, password: hashed });
      res.status(201).json({ success: true, user: { ...user.toObject(), password: undefined } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}; 