const Donation = require("../models/Donation");
const PatientAssistance = require("../models/PatientAssistance");


// Create donation (chỉ dùng VNPAY)
exports.createDonation = async (req, res) => {
  try {
    const {
      amount,
      campaignId,
      isAnonymous,
      purpose,
      assistanceId,
      paymentMethod,
    } = req.body;

    // Chỉ cho phép VNPAY
    if (paymentMethod !== "vnpay") {
      return res.status(400).json({
        success: false,
        message: "Chỉ hỗ trợ thanh toán qua VNPAY",
      });
    }

    // Validate số tiền
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số tiền quyên góp không hợp lệ",
      });
    }

    // Tạo donation mới
    const donation = new Donation({
      userId: req.user._id,
      campaignId,
      amount,
      isAnonymous: isAnonymous || false,
      purpose: purpose || "",
      paymentMethod,
    });

    await donation.save();

    // Nếu gắn với yêu cầu hỗ trợ bệnh nhân
    if (assistanceId) {
      const assistance = await PatientAssistance.findById(assistanceId);
      if (assistance && donation.type === "money") {
        assistance.raisedAmount += donation.amount;
        assistance.donationIds.push(donation._id);
        await assistance.save();
      }
    }

    // Giả lập tạo liên kết thanh toán VNPAY (sẽ thay bằng API thật)
    const payUrl = `https://sandbox.vnpayment.vn/pay/${donation._id}`;

    return res.status(201).json({
      success: true,
      message:
        "Tạo quyên góp thành công. Chuyển hướng đến VNPAY để thanh toán.",
      donation,
      payUrl,
    });
  } catch (error) {
    console.error("Create donation error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
    });
  }
};

// Get donations
exports.getDonations = async (req, res) => {
  try {
    const { limit = 10, page = 1, sort = "-createdAt", status } = req.query;
    let query = {};

    // Phân quyền: charity_admin và admin thấy tất cả
    if (!["admin", "charity_admin"].includes(req.user.role)) {
      query.userId = req.user._id;
    }

    if (status) query.status = status;

    // Sort động
    const sortObj = {};
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    sortObj[sortField] = sort.startsWith("-") ? -1 : 1;

    const donations = await Donation.find(query)
      .populate("userId", "fullName email")
      .populate("campaignId", "title")
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Donation.countDocuments(query);

    return res.json({
      success: true,
      data: donations, // ĐỔI TỪ "donations" → "data"
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
