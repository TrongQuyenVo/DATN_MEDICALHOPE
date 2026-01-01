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
    const { role, status, limit = 10, page = 1, q } = req.query;
    let match = {};

    if (role) match.role = role;
    if (status) match.status = status;
    if (q && q.trim()) {
      match.$or = [
        { fullName: { $regex: q.trim(), $options: "i" } },
        { email: { $regex: q.trim(), $options: "i" } },
      ];
    }

    const numericLimit = parseInt(limit) || 10;
    const numericPage = parseInt(page) || 1;

    // compute month boundaries for "new this month"
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Use aggregation to fetch paged users and aggregated stats in one trip
    const agg = await User.aggregate([
      { $match: match },
      {
        $facet: {
          users: [
            { $sort: { createdAt: -1 } },
            { $skip: (numericPage - 1) * numericLimit },
            { $limit: numericLimit },
            { $project: { passwordHash: 0 } },
          ],
          stats: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                active: {
                  $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
                },
                inactive: {
                  $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] },
                },
                suspended: {
                  $sum: { $cond: [{ $eq: ["$status", "suspended"] }, 1, 0] },
                },
                verified: {
                  $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
                },
                newThisMonth: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $gte: ["$createdAt", monthStart] },
                          { $lt: ["$createdAt", monthEnd] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    ]);

    const users = agg[0] && agg[0].users ? agg[0].users : [];
    const statsRaw =
      agg[0] && agg[0].stats && agg[0].stats[0] ? agg[0].stats[0] : null;

    const total = statsRaw ? statsRaw.total : await User.countDocuments(match);

    res.json({
      success: true,
      users,
      pagination: {
        total,
        pages: Math.ceil(total / numericLimit),
        page: numericPage,
        limit: numericLimit,
      },
      stats: statsRaw || {
        total,
        active: 0,
        verified: 0,
        newThisMonth: 0,
        suspended: 0,
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
