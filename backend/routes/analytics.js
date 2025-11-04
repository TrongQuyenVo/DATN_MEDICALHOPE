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
router.get(
  "/admin-dashboard",
  auth,
  authorize("admin"),
  async (req, res) => {
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
          ? ((appointmentsThisMonth / totalAppointmentsThisMonth) * 100).toFixed(1)
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
            donations: { $sum: "$amount" }
          }
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
  }
);

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

module.exports = router;