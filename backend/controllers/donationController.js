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
        .json({ success: false, message: "Chỉ hỗ trợ thanh toán qua VNPAY" });
    }

    // 2. Kiểm tra số tiền
    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Số tiền quyên góp không hợp lệ" });
    }

    // 3. Kiểm tra assistance tồn tại
    const assistance = await PatientAssistance.findById(assistanceId);
    if (!assistance) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy yêu cầu hỗ trợ" });
    }

    // 4. Kiểm tra không vượt quá số tiền còn thiếu (tùy chọn - frontend cũng đã validate)
    const remaining = assistance.requestedAmount - assistance.raisedAmount;
    if (amount > remaining) {
      return res.status(400).json({
        success: false,
        message: `Số tiền quyên góp vượt quá số còn thiếu (${remaining.toLocaleString()}đ)`,
      });
    }

    // 5. Tạo donation (pending)
    const donation = new Donation({
      userId: req.user?._id || null,
      assistanceId,
      amount,
      paymentMethod: "vnpay",
      status: "pending",
      isAnonymous,
      donorName: isAnonymous ? null : donorName?.trim() || null,
      donorEmail: isAnonymous ? null : donorEmail?.trim() || null,
      donorPhone: isAnonymous ? null : donorPhone?.trim() || null,
      message: message?.trim() || null,
    });

    await donation.save();

    // 6. Trả về donation để frontend dùng tạo URL VNPay
    return res.status(201).json({
      success: true,
      message: "Tạo đơn quyên góp thành công",
      donation: {
        _id: donation._id,
        amount: donation.amount,
        assistanceId: donation.assistanceId,
        status: donation.status,
        createdAt: donation.createdAt,
      },
    });
  } catch (error) {
    console.error("Create donation error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
    });
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

exports.createConfirmedDonation = async (req, res) => {
  try {
    const {
      assistanceId,
      amount,
      isAnonymous,
      donorName,
      donorEmail,
      donorPhone,
      message,
      vnp_TxnRef,
      vnp_TransactionNo,
      vnp_BankCode,
      vnp_PayDate,
    } = req.body;

    // Kiểm tra trùng lặp (theo vnp_TxnRef)
    const existed = await Donation.findOne({
      "paymentInfo.vnp_TxnRef": vnp_TxnRef,
    });
    if (existed) {
      return res
        .status(200)
        .json({ success: true, message: "Đã xử lý trước đó" });
    }

    const donation = new Donation({
      assistanceId,
      amount,
      paymentMethod: "vnpay",
      status: "completed",
      isAnonymous,
      donorName: isAnonymous ? null : donorName,
      donorEmail: isAnonymous ? null : donorEmail,
      donorPhone: isAnonymous ? null : donorPhone,
      message,
      paymentInfo: {
        vnp_TxnRef,
        vnp_TransactionNo,
        vnp_BankCode,
        vnp_PayDate,
        paidAt: new Date(),
      },
    });

    await donation.save();

    // Cộng tiền vào assistance
    await PatientAssistance.findByIdAndUpdate(assistanceId, {
      $inc: { raisedAmount: amount },
    });

    return res.json({ success: true, donation });
  } catch (error) {
    console.error("Create confirmed donation error:", error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
