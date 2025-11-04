// routes/admin.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Donation = require("../models/Donation");
const CharityOrg = require("../models/CharityOrg");
const PatientAssistance = require("../models/PatientAssistance");
const Patient = require("../models/Patient");
const { auth, authorize } = require("../middleware/auth");

// Chỉ admin và charity_admin
router.get(
  "/dashboard",
  auth,
  authorize("admin", "charity_admin"),
  async (req, res) => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));

      // 1. Tổng người dùng
      const totalUsers = await User.countDocuments({ isActive: true });

      // 2. Bác sĩ tình nguyện
      const volunteerDoctors = await Doctor.countDocuments({
        isVolunteer: true,
      });

      // 3. Quyên góp tháng này
      const monthlyDonations = await Donation.aggregate([
        {
          $match: {
            status: "completed",
            createdAt: { $gte: startOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      const donationThisMonth = (monthlyDonations[0]?.total || 0) / 1_000_000; // triệu

      // 4. Tổ chức từ thiện
      const totalCharities = await CharityOrg.countDocuments({
        isActive: true,
      });

      // 5. Người dùng mới hôm nay
      const newUsersToday = await User.countDocuments({
        createdAt: { $gte: startOfDay },
        isActive: true,
      });

      // 6. Quyên góp lớn gần đây
      const recentLargeDonation = await Donation.findOne({
        status: "completed",
        createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      })
        .sort({ amount: -1 })
        .populate("userId", "fullName")
        .select("amount userId createdAt");

      // 7. Yêu cầu hỗ trợ khẩn cấp
      const urgentRequests = await PatientAssistance.countDocuments({
        urgency: "critical",
        status: "pending",
      });

      // 8. Backup hệ thống (giả lập)
      const lastBackup = new Date().toLocaleString("vi-VN");

      // 9. Yêu cầu chờ duyệt
      const pendingDoctorVerifications = await Doctor.countDocuments({
        license: { $exists: true },
        isVerified: { $ne: true },
      });
      const pendingAssistance = await PatientAssistance.countDocuments({
        status: "pending",
      });
      const pendingPatientVerifications = await Patient.countDocuments({
        isVerified: false,
      });

      // 10. Mục tiêu tháng
      const targetDonations = 200_000_000; // 200M
      const targetNewPatients = 500;
      const targetVolunteers = 200;

      const newPatientsThisMonth = await Patient.countDocuments({
        createdAt: { $gte: startOfMonth },
      });

      res.json({
        stats: [
          {
            title: "Tổng người dùng",
            value: totalUsers.toLocaleString("vi-VN"),
            change: "+12.5%", // có thể tính động
            changeType: "increase",
            icon: "Users",
            color: "text-primary",
          },
          {
            title: "Bác sĩ tình nguyện",
            value: volunteerDoctors,
            change: "+8.2%",
            changeType: "increase",
            icon: "Stethoscope",
            color: "text-secondary",
          },
          {
            title: "Quyên góp tháng này",
            value: `${donationThisMonth.toFixed(0)}M VNĐ`,
            change: "+15.3%",
            changeType: "increase",
            icon: "Gift",
            color: "text-success",
          },
          {
            title: "Tổ chức từ thiện",
            value: totalCharities,
            change: "+2",
            changeType: "increase",
            icon: "Building2",
            color: "text-warning",
          },
        ],
        recentActivities: [
          {
            id: 1,
            type: "user",
            message: `${newUsersToday} người dùng mới đăng ký hôm nay`,
            time: "2 giờ trước",
            status: "info",
          },
          recentLargeDonation && {
            id: 2,
            type: "donation",
            message: `Nhận được quyên góp ${(
              recentLargeDonation.amount / 1_000_000
            ).toFixed(0)}M VNĐ từ ${
              recentLargeDonation.userId?.fullName || "ẩn danh"
            }`,
            time: "4 giờ trước",
            status: "success",
          },
          {
            id: 3,
            type: "alert",
            message: `${urgentRequests} yêu cầu hỗ trợ khẩn cấp cần duyệt`,
            time: "6 giờ trước",
            status: "warning",
          },
          {
            id: 4,
            type: "system",
            message: `Hoàn thành backup dữ liệu hệ thống lúc ${lastBackup}`,
            time: "1 ngày trước",
            status: "success",
          },
        ].filter(Boolean),
        pendingRequests: [
          {
            type: "Xác thực bác sĩ",
            count: pendingDoctorVerifications,
            route: "/doctors",
          },
          {
            type: "Duyệt yêu cầu hỗ trợ",
            count: pendingAssistance,
            route: "/assistance",
          },
          {
            type: "Xác minh bệnh nhân",
            count: pendingPatientVerifications,
            route: "/patients",
          },
        ],
        monthlyTargets: [
          {
            title: "Quyên góp",
            current: donationThisMonth,
            target: 200,
            unit: "M VNĐ",
          },
          {
            title: "Bệnh nhân mới",
            current: newPatientsThisMonth,
            target: targetNewPatients,
            unit: "người",
          },
          {
            title: "Bác sĩ tình nguyện",
            current: volunteerDoctors,
            target: targetVolunteers,
            unit: "người",
          },
        ],
      });
    } catch (error) {
      console.error("Admin Dashboard Error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
