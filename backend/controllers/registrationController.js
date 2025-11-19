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
  const files = req.files;

  if (!files.identityCard || files.identityCard.length === 0) {
    return res
      .status(400)
      .json({ message: "Vui lòng tải lên ít nhất 1 ảnh CMND/CCCD" });
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

  const registration = await Registration.create({
    packageId,
    packageTitle,
    fullName,
    phone,
    dob,
    gender: gender || null,
    address,
    healthIssue,
    commitment: commitment === "true",

    identityCard: getFileUrls(files.identityCard),
    povertyCertificate: getFileUrls(files.povertyCertificate),
    medicalRecords: getFileUrls(files.medicalRecords),
    dischargePaper: getFileUrls(files.dischargePaper),
  });

  res.status(201).json({
    success: true,
    message: "Đăng ký thành công!",
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
