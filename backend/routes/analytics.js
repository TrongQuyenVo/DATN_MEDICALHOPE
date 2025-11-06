const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Donation = require("../models/Donation");
const Appointment = require("../models/Appointment");
const PatientAssistance = require("../models/PatientAssistance");
const Doctor = require("../models/Doctor");
const CharityOrg = require("../models/CharityOrg");

// IMPORT THIẾU → ĐÃ THÊM
const { auth, authorize } = require("../middleware/auth");

// ===============================================
// 1. DASHBOARD CHO ADMIN (GIỮ NGUYÊN CODE CŨ)
// ===============================================
router.get("/admin-dashboard", auth, authorize("admin"), async (req, res) => {
  try {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Tổng người dùng
    const totalUsers = await User.countDocuments({ isActive: true });

    // 2. Tổng quyên góp
    const totalDonations = await Donation.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // 3. Lịch hẹn tháng này
    const appointmentsThisMonth = await Appointment.countDocuments({
      scheduledTime: { $gte: startOfMonth },
      status: { $in: ["completed", "confirmed", "in_progress"] },
    });

    // 4. Tỷ lệ hoàn thành lịch hẹn
    const totalAppointmentsThisMonth = await Appointment.countDocuments({
      scheduledTime: { $gte: startOfMonth },
    });
    const completionRate =
      totalAppointmentsThisMonth > 0
        ? ((appointmentsThisMonth / totalAppointmentsThisMonth) * 100).toFixed(
            1
          )
        : 0;

    // 5. Tăng trưởng người dùng theo tháng
    const monthlyGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYear },
          isActive: true,
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          users: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 6. Phân bố người dùng theo role
    const userDistribution = await User.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    // 7. Quyên góp theo tháng
    const monthlyDonations = await Donation.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: startOfYear },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          donations: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 8. Lịch hẹn theo ngày trong tuần
    const weeklyAppointments = await Appointment.aggregate([
      {
        $match: {
          scheduledTime: {
            $gte: new Date(now.setDate(now.getDate() - 7)),
          },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: "$scheduledTime" },
          appointments: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 9. Phân loại quyên góp
    const donationCategories = await PatientAssistance.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$requestType",
          amount: { $sum: "$raisedAmount" },
        },
      },
    ]);

    // 10. Top bác sĩ
    const topDoctors = await Appointment.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$doctorId",
          appointments: { $sum: 1 },
        },
      },
      { $sort: { appointments: -1 } },
      { $limit: 4 },
      {
        $lookup: {
          from: "doctors",
          localField: "_id",
          foreignField: "userId",
          as: "doctorInfo",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "doctorInfo.userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $project: {
          name: { $arrayElemAt: ["$userInfo.fullName", 0] },
          specialty: { $arrayElemAt: ["$doctorInfo.specialty", 0] },
          appointments: 1,
          rating: {
            $ifNull: [{ $arrayElemAt: ["$doctorInfo.rating", 0] }, 4.5],
          },
        },
      },
    ]);

    res.json({
      keyMetrics: {
        totalUsers,
        totalDonations: totalDonations[0]?.total || 0,
        appointmentsThisMonth,
        completionRate: parseFloat(completionRate),
      },
      monthlyGrowth: monthlyGrowth.map((m, i) => ({
        month: `T${m._id}`,
        users: m.users,
      })),
      userDistribution: userDistribution.map((d) => ({
        role:
          {
            patient: "Bệnh nhân",
            doctor: "Bác sĩ",
            charity_admin: "Quản trị từ thiện",
            admin: "Quản trị viên",
          }[d._id] || d._id,
        count: d.count,
        color: {
          patient: "#3b82f6",
          doctor: "#10b981",
          charity_admin: "#f59e0b",
          admin: "#ef4444",
        }[d._id],
      })),
      monthlyDonations: monthlyDonations.map((m) => ({
        month: `T${m._id}`,
        donations: m.donations,
      })),
      weeklyAppointments: weeklyAppointments.map((d, i) => ({
        day: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d._id - 1],
        appointments: d.appointments,
        completed: d.completed,
      })),
      donationCategories: donationCategories.map((c) => ({
        category:
          {
            medical_treatment: "Điều trị y tế",
            medication: "Thuốc men",
            equipment: "Thiết bị y tế",
            emergency: "Hỗ trợ khẩn cấp",
            other: "Khác",
          }[c._id] || c._id,
        amount: c.amount,
        percentage: 0, // sẽ tính sau
      })),
      topDoctors,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ===============================================
// 2. DASHBOARD CHO CHARITY ADMIN (GIỮ NGUYÊN CODE CŨ)
// ===============================================
router.get(
  "/charity-dashboard",
  auth,
  authorize("charity_admin"),
  async (req, res) => {
    try {
      const totalDonations = await Donation.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);

      const patientsHelped = await PatientAssistance.countDocuments({
        status: "completed",
      });
      const pendingRequests = await PatientAssistance.countDocuments({
        status: "pending",
      });

      // Tính tăng trưởng (so sánh tháng này vs tháng trước)
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const donationsThisMonth = await Donation.countDocuments({
        status: "completed",
        createdAt: { $gte: thisMonth },
      });
      const donationsLastMonth = await Donation.countDocuments({
        status: "completed",
        createdAt: { $gte: lastMonth, $lt: thisMonth },
      });

      const donationGrowth =
        donationsLastMonth === 0
          ? 100
          : Math.round(
              ((donationsThisMonth - donationsLastMonth) / donationsLastMonth) *
                100
            );

      res.json({
        totalDonations: totalDonations[0]?.total || 0,
        patientsHelped,
        pendingRequests,
        donationGrowth,
        newPatients: 23, // Có thể tính động
        newRequests: 12,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ===============================================
// 3. PENDING COUNTS (MỚI – THÊM VÀO CUỐI)
// ===============================================
router.get("/pending-counts", auth, authorize("admin"), async (req, res) => {
  try {
    const doctorPending = await Doctor.countDocuments({ status: "pending" });
    const assistancePending = await PatientAssistance.countDocuments({
      status: "pending",
    });
    const patientUnverified = await User.countDocuments({
      role: "patient",
      isVerified: false,
      isActive: true,
    });

    res.json({
      doctor: doctorPending,
      support: assistancePending,
      patient: patientUnverified,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===============================================
// 4. MONTHLY TARGETS (MỚI – THÊM VÀO CUỐI)
// ===============================================
router.get("/monthly-targets", auth, authorize("admin"), async (req, res) => {
  try {
    res.json({
      donations: 200, // 200 triệu
      newPatients: 500,
      doctors: 200,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===============================================
// 5. RECENT ACTIVITIES (MỚI – THÊM VÀO CUỐI)
// ===============================================
function formatRelativeTime(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  return new Date(date).toLocaleDateString("vi-VN");
}

router.get("/recent-activities", auth, authorize("admin"), async (req, res) => {
  try {
    const activities = [];

    // Người dùng mới
    const recentUsers = await User.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("fullName createdAt _id");
    recentUsers.forEach((u) =>
      activities.push({
        id: `user-${u._id}`,
        message: `${u.fullName} đã đăng ký tài khoản`,
        time: formatRelativeTime(u.createdAt),
        timestamp: u.createdAt,
        status: "info",
      })
    );

    // Quyên góp mới
    const recentDonations = await Donation.find({ status: "completed" })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("amount donorName createdAt _id");
    recentDonations.forEach((d) =>
      activities.push({
        id: `donation-${d._id}`,
        message: `Nhận ${(d.amount / 1e6).toFixed(1)}M VNĐ từ ${
          d.donorName || "Ẩn danh"
        }`,
        time: formatRelativeTime(d.createdAt),
        timestamp: d.createdAt,
        status: "success",
      })
    );

    // Yêu cầu hỗ trợ mới
    const recentAssistance = await PatientAssistance.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .limit(2)
      .select("patientName createdAt _id");
    recentAssistance.forEach((a) =>
      activities.push({
        id: `assist-${a._id}`,
        message: `Yêu cầu hỗ trợ mới từ ${a.patientName}`,
        time: formatRelativeTime(a.createdAt),
        timestamp: a.createdAt,
        status: "warning",
      })
    );

    // SORT THEO timestamp (Date object)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(activities.slice(0, 10));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
