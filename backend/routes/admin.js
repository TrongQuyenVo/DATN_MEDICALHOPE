// routes/admin.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Donation = require("../models/Donation");
const PatientAssistance = require("../models/PatientAssistance");
const Patient = require("../models/Patient");
const { auth, authorize } = require("../middleware/auth");

// Helper: Định dạng thời gian tiếng Việt
const formatRelativeTime = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

router.get(
  "/dashboard",
  auth,
  authorize("admin"),
  async (req, res) => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

      // === 1. Các số liệu chính ===
      const totalUsers = await User.countDocuments({ isActive: true });
      const volunteerDoctors = await Doctor.countDocuments({
        isVolunteer: true,
      });

      const monthlyDonations = await Donation.aggregate([
        {
          $match: {
            status: "completed",
            createdAt: { $gte: startOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      const donationThisMonth = monthlyDonations[0]?.total || 0; // Số tiền thật

      const totalCharities = await CharityOrg.countDocuments({
        isActive: true,
      });

      const newUsersToday = await User.countDocuments({
        createdAt: { $gte: startOfDay },
        isActive: true,
      });

      const newPatientsThisMonth = await Patient.countDocuments({
        createdAt: { $gte: startOfMonth },
      });

      // === 2. Yêu cầu đang chờ xử lý ===
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
      const urgentRequests = await PatientAssistance.countDocuments({
        urgency: "critical",
        status: "pending",
      });

      // === 3. HOẠT ĐỘNG GẦN ĐÂY ===
      const recentDonations = await Donation.find({
        status: "completed",
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("userId", "fullName")
        .populate("patientId", "fullName")
        .select("amount userId patientId createdAt isAnonymous");

      const activities = [];

      recentDonations.forEach((donation) => {
        const donorName = donation.isAnonymous
          ? "Một nhà hảo tâm"
          : donation.userId?.fullName || "Ẩn danh";

        const patientPart = donation.patientId
          ? ` cho bệnh nhân ${donation.patientId.fullName}`
          : " vào quỹ chung";

        activities.push({
          id: `donation_${donation._id}`,
          type: "donation",
          // ĐÃ SỬA: Không chia triệu, không làm tròn
          message: `${donorName} đã quyên góp ${donation.amount.toLocaleString(
            "vi-VN"
          )} VNĐ${patientPart}`,
          time: formatRelativeTime(donation.createdAt),
          timestamp: donation.createdAt,
          status: "success",
        });
      });

      if (newUsersToday > 0) {
        activities.push({
          id: "new_users_today",
          type: "user",
          message: `${newUsersToday} người dùng mới đăng ký hôm nay`,
          time: "Vừa xong",
          timestamp: now,
          status: "info",
        });
      }

      if (urgentRequests > 0) {
        activities.push({
          id: "urgent_requests",
          type: "alert",
          message: `${urgentRequests} yêu cầu hỗ trợ khẩn cấp cần xử lý ngay`,
          time: "Cấp bách",
          timestamp: now,
          status: "warning",
        });
      }

      activities.sort((a, b) => b.timestamp - a.timestamp);
      const recentActivities = activities
        .slice(0, 10)
        .map(({ timestamp, ...act }) => act);

      // === RESPONSE CHUẨN 100% ===
      res.json({
        keyMetrics: {
          totalUsers,
          totalDonations: donationThisMonth, // Số tiền thật
          appointmentsThisMonth: 0,
          completionRate: 0,
        },
        userDistribution: [{ role: "Bác sĩ", count: volunteerDoctors }],
        previousMetrics: {
          totalUsers: 0,
          doctors: 0,
          donations: 0,
          partners: 0,
        },
        stats: [
          {
            title: "Tổng người dùng",
            value: totalUsers.toLocaleString("vi-VN"),
            change: "+12.5%",
            changeType: "increase",
            icon: "Users",
          },
          {
            title: "Bác sĩ tình nguyện",
            value: volunteerDoctors.toLocaleString("vi-VN"),
            change: "+8.2%",
            changeType: "increase",
            icon: "Stethoscope",
            color: "text-secondary",
          },
          {
            title: "Quyên góp tháng này",
            // ĐÃ SỬA: Hiển thị đầy đủ, không chia triệu
            value: `${donationThisMonth.toLocaleString("vi-VN")} VNĐ`,
            change: "+15.3%",
            changeType: "increase",
            icon: "Gift",
          },
          {
            title: "Tổ chức từ thiện",
            value: totalCharities.toLocaleString("vi-VN"),
            change: "+3",
            changeType: "increase",
            icon: "Building2",
          },
        ],
        recentActivities,
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
        // ĐÃ SỬA HOÀN TOÀN: Target đúng 200 triệu
        monthlyTargets: [
          {
            title: "Quyên góp",
            current: donationThisMonth,
            target: 200_000_000, // ← ĐÚNG: 200 triệu
            unit: "VNĐ",
          },
          {
            title: "Bệnh nhân mới",
            current: newPatientsThisMonth,
            target: 500,
            unit: "người",
          },
          {
            title: "Bác sĩ tình nguyện",
            current: volunteerDoctors,
            target: 200,
            unit: "người",
          },
        ],
      });
    } catch (error) {
      console.error("Admin Dashboard Error:", error);
      res.status(500).json({ message: "Lỗi máy chủ" });
    }
  }
);

module.exports = router;
