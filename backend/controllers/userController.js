const User = require("../models/User");
const multer = require("multer");
const path = require("path");

// Multer storage giống partner
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Update user profile
exports.updateUserProfile = [
  upload.single("avatar"),
  async (req, res) => {
    try {
      // Nếu gửi multipart/form-data, req.body.profile có thể là chuỗi JSON
      let { fullName, phone, profile } = req.body;

      if (typeof profile === "string" && profile.trim()) {
        try {
          profile = JSON.parse(profile);
        } catch (e) {
          // nếu parse lỗi, bỏ qua việc parse để tránh crash
          profile = undefined;
        }
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Merge từng field (nếu có)
      user.fullName = fullName ?? user.fullName;
      user.phone = phone ?? user.phone;

      // Nếu có file upload, cập nhật avatar
      if (req.file) {
        user.avatar = `/uploads/${req.file.filename}`;
      }

      // Merge sâu cho profile (nếu gửi)
      if (profile && typeof profile === "object") {
        user.profile = {
          ...(user.profile && typeof user.profile.toObject === "function"
            ? user.profile.toObject()
            : user.profile || {}),
          ...profile,
        };
      }

      const updatedUser = await user.save();

      // ẩn passwordHash trước khi trả về
      const userObj = updatedUser.toObject();
      delete userObj.passwordHash;

      res.json({
        success: true,
        message: "Profile updated successfully",
        user: userObj,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
];

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.passwordHash = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { role, status, limit = 10, page = 1 } = req.query;
    let query = {};

    if (role) query.role = role;
    if (status) query.status = status;

    const users = await User.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// Suspend user
exports.suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(
      id,
      { status: "suspended" },
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User suspended successfully",
      user,
    });
  } catch (error) {
    console.error("Suspend user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Activate user
exports.activateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(
      id,
      { status: "active" },
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User activated successfully",
      user,
    });
  } catch (error) {
    console.error("Activate user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
