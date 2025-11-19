// routes/registrations.js
const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const {
  createRegistration,
  getAllRegistrations,
  updateRegistrationStatus,
  deleteRegistration,
} = require("../controllers/registrationController");

const registrationUpload = upload.fields([
  { name: "identityCard", maxCount: 10 },
  { name: "povertyCertificate", maxCount: 5 },
  { name: "medicalRecords", maxCount: 15 },
  { name: "dischargePaper", maxCount: 10 },
]);

// Nếu bạn có middleware bảo vệ admin thì thêm vào đây
// const { protect, adminOnly } = require('../middleware/auth');

// Public: Người dùng gửi đơn
router.post("/", registrationUpload, createRegistration);

// Admin (bỏ comment 2 dòng dưới nếu có middleware auth)
// router.get('/', protect, adminOnly, getAllRegistrations);
// router.patch('/:id', protect, adminOnly, updateRegistrationStatus);
// router.delete('/:id', protect, adminOnly, deleteRegistration);

// Tạm thời để public cho dễ test
router.get("/", getAllRegistrations);
router.patch("/:id", updateRegistrationStatus);
router.delete("/:id", deleteRegistration);

module.exports = router;
