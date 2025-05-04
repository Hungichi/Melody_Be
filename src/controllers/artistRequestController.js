const ArtistRequest = require('../models/ArtistRequest');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

exports.createArtistRequest = async (req, res) => {
  try {
    const { stageName, email, phone, bio } = req.body;
    const userId = req.user._id;

    // Kiểm tra request đang pending
    const existingRequest = await ArtistRequest.findOne({ 
      userId, 
      status: 'pending' 
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã có một yêu cầu đang chờ xử lý'
      });
    }

    // Kiểm tra email có khớp với email của user
    if (email !== req.user.email) {
      return res.status(400).json({
        success: false,
        message: 'Email phải trùng với email tài khoản của bạn'
      });
    }

    // Lấy url ảnh từ middleware
    const profileImageUrl = req.file.cloudinaryUrl;

    // Tạo artist request mới
    const artistRequest = new ArtistRequest({
      userId,
      stageName,
      email,
      phone,
      bio,
      profileImageUrl
    });

    await artistRequest.save();

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công! Yêu cầu của bạn đang được xem xét.',
      data: artistRequest
    });

  } catch (error) {
    console.error('Detailed error in createArtistRequest:', error);
    
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
      message: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.'
    });
  }
};

// Lấy danh sách request cho admin
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await ArtistRequest.find()
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: requests
    });

  } catch (error) {
    console.error('Error in getAllRequests:', error);
    res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi lấy danh sách yêu cầu'
    });
  }
};

// Approve hoặc reject request
exports.updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    const request = await ArtistRequest.findByIdAndUpdate(
      requestId,
      { 
        status,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu'
      });
    }

    // Nếu request được approved, cập nhật role và stageName của user
    if (status === 'approved') {
      try {
        const user = await User.findById(request.userId);
        if (user) {
          user.role = 'artist';
          user.stageName = request.stageName; // Cập nhật stageName từ request
          await user.save();
          console.log(`User ${user._id} updated to artist with stageName: ${request.stageName}`);
        } else {
          console.error(`User not found for approved request: ${requestId}`);
        }
      } catch (userUpdateError) {
        console.error(`Error updating user for request ${requestId}:`, userUpdateError);
      }
    }

    const statusMessage = status === 'approved' ? 'chấp nhận' : 'từ chối';
    res.status(200).json({
      success: true,
      message: `Yêu cầu đã được ${statusMessage}${status === 'approved' ? ' và tài khoản đã được nâng cấp thành nghệ sĩ' : ''}`,
      data: request
    });

  } catch (error) {
    console.error('Error in updateRequestStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi cập nhật trạng thái'
    });
  }
};

// Lấy request của user hiện tại
exports.getUserRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const request = await ArtistRequest.findOne({ userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: request
    });

  } catch (error) {
    console.error('Error in getUserRequest:', error);
    res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi lấy thông tin yêu cầu'
    });
  }
};

// Cập nhật request của user
exports.updateArtistRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { stageName, email, phone, bio } = req.body;
    const userId = req.user._id;

    // Tìm request cần cập nhật
    const existingRequest = await ArtistRequest.findOne({
      _id: requestId,
      userId: userId
    });

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu hoặc bạn không có quyền cập nhật'
      });
    }

    // Chỉ cho phép cập nhật nếu request đang ở trạng thái pending
    if (existingRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể cập nhật yêu cầu đang chờ duyệt'
      });
    }

    // Kiểm tra email có khớp với email của user
    if (email !== req.user.email) {
      return res.status(400).json({
        success: false,
        message: 'Email phải trùng với email tài khoản của bạn'
      });
    }

    // Lấy url ảnh từ middleware nếu có upload mới
    let profileImageUrl = req.file && req.file.cloudinaryUrl ? req.file.cloudinaryUrl : undefined;
    if (!profileImageUrl) {
      // Nếu không upload mới thì lấy url cũ
      profileImageUrl = existingRequest.profileImageUrl;
    }

    // Cập nhật request
    const updatedRequest = await ArtistRequest.findByIdAndUpdate(
      requestId,
      {
        stageName,
        email,
        phone,
        bio,
        profileImageUrl,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Cập nhật yêu cầu thành công!',
      data: updatedRequest
    });

  } catch (error) {
    console.error('Error in updateArtistRequest:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Đã có lỗi xảy ra khi cập nhật yêu cầu'
    });
  }
}; 