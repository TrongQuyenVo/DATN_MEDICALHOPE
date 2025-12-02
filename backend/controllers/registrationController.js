// controllers/registrationController.js
const Registration = require("../models/Registration");
const asyncHandler = require("express-async-handler");

const getFileUrls = (files) => {
  if (!files || files.length === 0) return [];
  const baseUrl = process.env.APP_URL || "http://localhost:5000";
  return files.map((file) => `${baseUrl}/uploads/${file.filename}`);
};

// Người dùng gửi đơn
const createRegistration = asyncHandler(async (req, res) => {
  const files = req.files; // multer đã gộp tất cả file lại

  // === TỔNG HỢP TẤT CẢ ẢNH NGƯỜI DÙNG CHỤP (không phân biệt field) ===
  let allUploadedFiles = [];

  if (files) {
    // files là object: { identityCard: [...], medicalRecords: [...], ... }
    Object.values(files).forEach((fileArray) => {
      if (Array.isArray(fileArray)) {
        allUploadedFiles = allUploadedFiles.concat(fileArray);
      }
    });
  }

  // BẮT BUỘC phải có ít nhất 1 ảnh (dù chụp gì cũng được)
  if (allUploadedFiles.length === 0) {
    return res
      .status(400)
      .json({ message: "Vui lòng chụp ít nhất 1 ảnh giấy tờ" });
  }

  const {
    packageId,
    packageTitle,
    fullName,
    phone,
    dob,
    gender,
    address,
    healthIssue,
    commitment,
  } = req.body;

  const imageUrls = getFileUrls(allUploadedFiles);

  const registration = await Registration.create({
    packageId,
    packageTitle,
    fullName: fullName || "Không ghi tên",
    phone: phone || "Không có số điện thoại",
    dob: dob || "Không rõ",
    gender: gender || null,
    address: address || "Không ghi địa chỉ",
    healthIssue: healthIssue || "Cần hỗ trợ khám bệnh",

    identityCard: imageUrls,
    medicalRecords: imageUrls,
    povertyCertificate: imageUrls,
    dischargePaper: imageUrls,

    commitment: commitment === "true",
  });

  res.status(201).json({
    success: true,
    message: "Đăng ký thành công! Chúng tôi sẽ gọi lại sớm",
    data: registration,
  });
});

// Admin lấy danh sách
const getAllRegistrations = asyncHandler(async (req, res) => {
  const registrations = await Registration.find().sort({ createdAt: -1 });
  res.json(registrations);
});

// Admin duyệt / từ chối
const updateRegistrationStatus = asyncHandler(async (req, res) => {
  const { status, rejectReason } = req.body;
  const registration = await Registration.findById(req.params.id);

  if (!registration) {
    return res.status(404).json({ message: "Không tìm thấy đơn" });
  }

  registration.status = status;
  if (status === "rejected") {
    registration.rejectReason = rejectReason || "Không đủ điều kiện";
  } else {
    registration.rejectReason = null;
  }

  await registration.save();
  res.json({ success: true, data: registration });
});

// Admin xóa đơn
const deleteRegistration = asyncHandler(async (req, res) => {
  const registration = await Registration.findById(req.params.id);
  if (!registration) {
    return res.status(404).json({ message: "Không tìm thấy đơn" });
  }
  await registration.deleteOne();
  res.json({ success: true, message: "Đã xóa đơn" });
});

module.exports = {
  createRegistration,
  getAllRegistrations,
  updateRegistrationStatus,
  deleteRegistration,
};
