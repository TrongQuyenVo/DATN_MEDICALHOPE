const Donation = require("../models/Donation");
const PatientAssistance = require("../models/PatientAssistance");


// Create donation (chỉ dùng VNPAY)
exports.createDonation = async (req, res) => {
  try {
    const {
      amount,
      assistanceId,  // NHẬN TỪ FRONTEND
      isAnonymous,
      paymentMethod,
    } = req.body;

    if (paymentMethod !== "vnpay") {
      return res.status(400).json({ success: false, message: "Chỉ hỗ trợ VNPAY" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Số tiền không hợp lệ" });
    }

    // TẠO DONATION
    const donation = new Donation({
      userId: req.user._id,
      assistanceId,  // GÁN
      amount,
      isAnonymous: isAnonymous || false,
      paymentMethod,
    });

    await donation.save();

    // CẬP NHẬT ASSISTANCE
    if (assistanceId) {
      const assistance = await PatientAssistance.findById(assistanceId);
      if (assistance) {
        assistance.raisedAmount += amount;
        assistance.donationIds.push(donation._id);
        await assistance.save();
      }
    }

    const payUrl = `https://sandbox.vnpayment.vn/pay/${donation._id}`;

    return res.status(201).json({
      success: true,
      message: "Tạo quyên góp thành công",
      donation,
      payUrl,
    });
  } catch (error) {
    console.error("Create donation error:", error);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ" });
  }
};

// Get donations
exports.getDonations = async (req, res) => {
  try {
    const { limit = 10, page = 1, sort = "-createdAt", status } = req.query;
    let query = {};

    if (!["admin", "charity_admin"].includes(req.user.role)) {
      query.userId = req.user._id;
    }

    if (status) query.status = status;

    const sortObj = {};
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    sortObj[sortField] = sort.startsWith("-") ? -1 : 1;

    // BỎ populate campaignId
    const donations = await Donation.find(query)
      .populate("userId", "fullName email")
      .populate("assistanceId", "title") // LẤY TITLE
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Donation.countDocuments(query);

    return res.json({
      success: true,
      data: donations,
      pagination: {
        total,
        pages: Math.ceil(total / parseInt(limit)),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get donations error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ: " + error.message,
    });
  }
};

// Update donation status
exports.updateDonationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy quyên góp",
      });
    }

    // Chỉ admin mới được đổi status
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Không có quyền thực hiện thao tác này",
      });
    }

    donation.status = status;
    if (status === "completed") {
      donation.confirmedAt = new Date();
    }
    await donation.save();

    return res.json({
      success: true,
      message: "Cập nhật trạng thái quyên góp thành công",
      donation,
    });
  } catch (error) {
    console.error("Update donation error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
    });
  }
};
