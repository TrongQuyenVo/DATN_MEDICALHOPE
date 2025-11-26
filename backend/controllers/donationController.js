const Donation = require("../models/Donation");
const PatientAssistance = require("../models/PatientAssistance");

// Create donation (chỉ dùng VNPAY)
exports.createDonation = async (req, res) => {
  try {
    const {
      amount,
      assistanceId,
      isAnonymous = false,
      paymentMethod,
      donorName,
      donorEmail,
      donorPhone,
      message,
    } = req.body;

    if (paymentMethod !== "vnpay") {
      return res
        .status(400)
        .json({ success: false, message: "Chỉ hỗ trợ VNPAY" });
    }

    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Số tiền không hợp lệ" });
    }

    // Kiểm tra assistance tồn tại và chưa đủ tiền
    const assistance = await PatientAssistance.findById(assistanceId);
    if (!assistance) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy yêu cầu hỗ trợ" });
    }

    // Tạo donation (chưa completed)
    const donation = new Donation({
      userId: req.user?._id || null, // có thể null
      assistanceId,
      amount,
      paymentMethod,
      isAnonymous,
      donorName: isAnonymous ? null : donorName || null,
      donorEmail: isAnonymous ? null : donorEmail || null,
      donorPhone: isAnonymous ? null : donorPhone || null,
      message: message || null,
      status: "pending", // chờ VNPay callback
    });

    await donation.save();

    // Trả về URL thanh toán VNPay thật (sẽ làm ở bước sau)
    // Tạm thời trả về donation + thông báo
    return res.status(201).json({
      success: true,
      message: "Tạo đơn quyên góp thành công, chuyển đến cổng thanh toán...",
      donation: donation,
      // payUrl: realVnpayUrl,
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
