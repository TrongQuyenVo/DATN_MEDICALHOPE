// controllers/donationController.js
const crypto = require("crypto");
const Donation = require("../models/Donation");
const PatientAssistance = require("../models/PatientAssistance");
const { createOrder } = require("../utils/paypal");

// Constants for VNPAY (move to config/env in production)
const VNPAY_CONFIG = {
  tmnCode: process.env.VNP_TMN_CODE, // e.g., from .env
  hashSecret: process.env.VNP_HASH_SECRET,
  url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  returnUrl: process.env.BASE_URL + "/api/donations/vnpay-return",
  ipnUrl: process.env.BASE_URL + "/api/donations/vnpay-ipn", // For IPN endpoint
  orderType: "250000", // Donation category
  expireMinutes: 15,
};

// Helper: Sort and build params string for hash
const getHashInput = (params) => {
  const sortedKeys = Object.keys(params).sort();
  return sortedKeys
    .map((key) => `${key}=${encodeURIComponent(params[key])}`)
    .join("&");
};

// Helper: Calculate secure hash
const calculateSecureHash = (input, secret) => {
  return crypto
    .createHmac("sha512", secret)
    .update(new Buffer.from(input, "utf-8"))
    .digest("hex");
};

// Create donation and generate VNPAY URL
// exports.createDonation = async (req, res) => {
//   try {
//     const {
//       amount,
//       assistanceId,
//       isAnonymous = false,
//       donorName,
//       donorEmail,
//       donorPhone,
//       message,
//     } = req.body;

//     // 1. Validate payment method (only VNPAY)
//     // Removed since hardcoded

//     // 2. Validate amount
//     if (!amount || amount <= 0) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Số tiền quyên góp không hợp lệ" });
//     }

//     // 3. Check assistance exists
//     const assistance = await PatientAssistance.findById(assistanceId);
//     if (!assistance) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Không tìm thấy yêu cầu hỗ trợ" });
//     }

//     // 4. Check not exceed remaining (optional, frontend also validates)
//     const remaining = assistance.requestedAmount - assistance.raisedAmount;
//     if (amount > remaining) {
//       return res.status(400).json({
//         success: false,
//         message: `Số tiền quyên góp vượt quá số còn thiếu (${remaining.toLocaleString()}đ)`,
//       });
//     }

//     // 5. Generate unique txnRef (orderId)
//     const txnRef =
//       Date.now().toString() + Math.floor(Math.random() * 1000).toString();

//     // 6. Create donation (pending)
//     const donation = new Donation({
//       userId: req.user?._id || null,
//       assistanceId,
//       amount,
//       paymentMethod: "vnpay",
//       txnRef,
//       status: "pending",
//       donorName: isAnonymous ? null : donorName?.trim() || null,
//       donorEmail: isAnonymous ? null : donorEmail?.trim() || null,
//       donorPhone: isAnonymous ? null : donorPhone?.trim() || null,
//       message: message?.trim() || null,
//     });

//     await donation.save();

//     // 7. Build VNPAY params
//     const getVnpDate = (date) => {
//       const d = new Date(date);
//       d.setHours(d.getHours() + 7);
//       return d
//         .toISOString()
//         .replace(/[-:T.]/g, "")
//         .slice(0, 14);
//     };

//     const createDate = getVnpDate(new Date());
//     const expireDate = getVnpDate(
//       new Date(Date.now() + VNPAY_CONFIG.expireMinutes * 60 * 1000)
//     );

//     const paymentData = {
//       vnp_Version: "2.1.0",
//       vnp_Command: "pay",
//       vnp_TmnCode: VNPAY_CONFIG.tmnCode,
//       vnp_Amount: amount * 100, // VND to subunits
//       vnp_CreateDate: createDate,
//       vnp_CurrCode: "VND",
//       vnp_IpAddr: req.ip || req.connection.remoteAddress || "127.0.0.1",
//       vnp_Locale: "vn",
//       vnp_OrderInfo: `Quyen gop cho benh nhan - ${assistance.title}`,
//       vnp_OrderType: VNPAY_CONFIG.orderType,
//       vnp_ReturnUrl: VNPAY_CONFIG.returnUrl,
//       vnp_ExpireDate: expireDate,
//       vnp_TxnRef: txnRef,
//     };

//     // 8. Sort and calculate hash
//     const sortedInput = getHashInput(paymentData);
//     const vnp_SecureHash = calculateSecureHash(
//       sortedInput,
//       VNPAY_CONFIG.hashSecret
//     );

//     // 9. Build payment URL
//     const paymentUrl = `${VNPAY_CONFIG.url}?${sortedInput}&vnp_SecureHash=${vnp_SecureHash}`;

//     // 10. Return donation info and payment URL
//     return res.status(201).json({
//       success: true,
//       message: "Tạo đơn quyên góp thành công",
//       donation: {
//         _id: donation._id,
//         amount: donation.amount,
//         assistanceId: donation.assistanceId,
//         txnRef: donation.txnRef,
//         createdAt: donation.createdAt,
//       },
//       paymentUrl,
//     });
//   } catch (error) {
//     console.error("Create donation error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Lỗi máy chủ, vui lòng thử lại sau",
//     });
//   }
// };


exports.createDonation = async (req, res) => {
  try {
    const {
      amount,
      assistanceId,
      isAnonymous = false,
      donorName,
      donorEmail,
      donorPhone,
      message,
    } = req.body;

    // Kiểm tra assistance
    const assistance = await PatientAssistance.findById(assistanceId);
    if (!assistance) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy yêu cầu hỗ trợ" });
    }

    const remaining = assistance.requestedAmount - assistance.raisedAmount;
    if (amount > remaining) {
      return res.status(400).json({
        success: false,
        message: `Chỉ còn thiếu ${remaining.toLocaleString()}đ`,
      });
    }

    // Tạo mã giao dịch duy nhất
    const txnRef = "PP" + Date.now() + Math.floor(Math.random() * 1000);

    // Tạo donation trước (pending)
    const donation = new Donation({
      userId: req.user?._id || null,
      assistanceId,
      amount,
      paymentMethod: "paypal",
      txnRef,
      status: "pending",
      isAnonymous,
      donorName: isAnonymous ? null : donorName?.trim(),
      donorEmail: isAnonymous ? null : donorEmail?.trim(),
      donorPhone: isAnonymous ? null : donorPhone?.trim(),
      message: message?.trim() || null,
    });

    // Tạo PayPal order
    const order = await createOrder(
      amount,
      "USD",
      `Quyên góp cho ${assistance.title}`,
      txnRef // dùng txnRef làm custom_id để sau này nhận diện
    );

    donation.paypalOrderId = order.id;
    await donation.save();

    const approveLink = order.links.find(
      (link) => link.rel === "approve"
    )?.href;

    return res.json({
      success: true,
      message: "Tạo đơn PayPal thành công",
      donation: { _id: donation._id, txnRef },
      paymentUrl: approveLink,
    });
  } catch (error) {
    console.error("Create donation error:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Handle VNPAY Return URL (for user display, not update DB)
exports.handleVnpayReturn = async (req, res) => {
  try {
    const params = req.query;
    const secureHash = params.vnp_SecureHash;

    // 1. Remove hash for verification
    delete params.vnp_SecureHash;
    delete params.vnp_SecureHashType;

    // 2. Sort and rebuild input
    const sortedInput = getHashInput(params);
    const checkHash = calculateSecureHash(sortedInput, VNPAY_CONFIG.hashSecret);

    // 3. Verify hash
    if (checkHash !== secureHash) {
      return res.status(400).json({
        success: false,
        message: "Chữ ký không hợp lệ",
        vnp_ResponseCode: "97", // Invalid signature
      });
    }

    // 4. Check response code
    const responseCode = params.vnp_ResponseCode;
    if (responseCode === "00") {
      // Success - redirect to success page with txnRef
      const txnRef = params.vnp_TxnRef;
      // Frontend can fetch donation by txnRef or show message
      return res.redirect(
        `/donation-success?txnRef=${txnRef}&amount=${params.vnp_Amount / 100}`
      );
    } else {
      // Failure - log and redirect to failure page
      console.error("VNPAY return failure:", params);
      return res.redirect(
        `/donation-failure?code=${responseCode}&message=${
          params.vnp_ResponseMessage || "Thanh toán thất bại"
        }`
      );
    }
  } catch (error) {
    console.error("Handle VNPAY return error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi xử lý phản hồi",
    });
  }
};

// Handle VNPAY IPN (server-to-server, update DB)
exports.handleVnpayIpn = async (req, res) => {
  try {
    let params = { ...req.query, ...req.body }; // Handle both GET/POST
    const secureHash = params.vnp_SecureHash;

    // 1. Remove hash for verification
    delete params.vnp_SecureHash;
    delete params.vnp_SecureHashType;

    // 2. Sort and rebuild input
    const sortedInput = getHashInput(params);
    const checkHash = calculateSecureHash(sortedInput, VNPAY_CONFIG.hashSecret);

    // 3. Verify hash
    if (checkHash !== secureHash) {
      return res
        .status(200)
        .json({ RspCode: "97", Message: "Invalid signature" });
    }

    // 4. Verify amount and txnRef
    const txnRef = params.vnp_TxnRef;
    const amount = parseInt(params.vnp_Amount) / 100;
    const responseCode = params.vnp_ResponseCode;
    const transactionStatus = params.vnp_TransactionStatus;

    // 5. Find donation
    const donation = await Donation.findOne({ txnRef });
    if (!donation) {
      return res
        .status(200)
        .json({ RspCode: "04", Message: "Order not found" });
    }

    // 6. Idempotency: Only update if pending
    if (donation.status !== "pending") {
      // Already processed
      return res
        .status(200)
        .json({ RspCode: "02", Message: "Order already confirmed" });
    }

    // 7. Validate amount matches
    if (donation.amount !== amount) {
      return res
        .status(200)
        .json({ RspCode: "04", Message: "Amount mismatch" });
    }

    // 8. Update based on status
    if (responseCode === "00" && transactionStatus === "00") {
      // Success
      donation.status = "completed";
      donation.confirmedAt = new Date();
      // Update assistance raised amount
      await PatientAssistance.findByIdAndUpdate(
        donation.assistanceId,
        { $inc: { raisedAmount: amount } },
        { new: true }
      );
      console.log(
        `Updated raisedAmount for assistance ${donation.assistanceId}`
      );
      await donation.save();
      console.log(`Donation ${txnRef} completed`);
    } else {
      // Failed
      donation.status = "failed";
      await donation.save();
      console.log(`Donation ${txnRef} failed: ${params.vnp_ResponseMessage}`);
    }

    // 9. Respond to VNPAY (00 = confirmed, stops retries)
    return res.status(200).json({ RspCode: "00", Message: "Confirm Success" });
  } catch (error) {
    console.error("Handle VNPAY IPN error:", error);
    return res.status(200).json({ RspCode: "99", Message: "System error" });
  }
};

// Get donations (updated: removed status filter, but keep for flexibility)
exports.getDonations = async (req, res) => {
  try {
    const { limit = 10, page = 1, sort = "-createdAt" } = req.query;
    let query = {};

    if (!["admin", "charity_admin"].includes(req.user.role)) {
      query.userId = req.user._id;
    }

    // Removed status filter since no pending state needed

    const sortObj = {};
    const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
    sortObj[sortField] = sort.startsWith("-") ? -1 : 1;

    const donations = await Donation.find(query)
      .populate("userId", "fullName email")
      .populate("assistanceId", "title")
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

exports.handlePaypalReturn = async (req, res) => {
  const { token } = req.query;
  if (!token) return res.redirect("/donation-failure?message=Missing token");

  try {
    const capture = await captureOrder(token);
    if (capture.status === "COMPLETED") {
      const customId =
        capture.purchase_units[0].custom_id ||
        capture.purchase_units[0].payments.captures[0].custom_id;
      return res.redirect(`/donation-success?txnRef=${customId}&method=paypal`);
    }
  } catch (err) {
    console.error("PayPal capture failed:", err.response?.data || err.message);
  }
  return res.redirect("/donation-failure");
};

// QUAN TRỌNG NHẤT: Webhook xác thực 100% tiền đã vào
exports.handlePaypalWebhook = async (req, res) => {
  try {
    // PayPal gửi JSON raw → phải dùng express.raw() ở route
    const event = req.body;

    // Chỉ xử lý khi tiền đã vào tài khoản
    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const capture = event.resource;
      const txnRef = capture.custom_id; // chính là txnRef mình gửi lúc tạo order

      const donation = await Donation.findOne({ txnRef });
      if (!donation || donation.status === "completed") {
        return res.status(200).send("OK");
      }

      donation.status = "completed";
      donation.paypalCaptureId = capture.id;
      donation.confirmedAt = new Date();
      await donation.save();

      // Cập nhật số tiền đã quyên góp cho bệnh nhân
      await PatientAssistance.findByIdAndUpdate(donation.assistanceId, {
        $inc: { raisedAmount: donation.amount },
      });

      console.log(
        `[PAYPAL] Donation ${txnRef} confirmed – ${donation.amount} USD`
      );
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(200).send("OK"); // vẫn trả 200 để PayPal không retry mãi
  }
};