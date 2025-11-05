const express = require("express");
const { auth, authorize } = require("../middleware/auth");
const patientController = require("../controllers/patientController");

const router = express.Router();

// 1. Tạo hồ sơ bệnh nhân (chỉ patient sau khi đăng ký)
router.post(
  "/",
  auth,
  authorize("patient"),
  patientController.createPatientProfile
);

// 2. Lấy & cập nhật profile cá nhân
router.get(
  "/profile",
  auth,
  authorize("patient"),
  patientController.getPatientProfile
);

router.put(
  "/profile",
  auth,
  authorize("patient"),
  patientController.updatePatientProfile
);

// 3. Admin/Charity/Doctor: lấy danh sách bệnh nhân
router.get(
  "/",
  auth,
  authorize("admin", "charity_admin", "doctor"),
  patientController.getAllPatients
);

// 4. Xác minh bệnh nhân
router.patch(
  "/:id/verify",
  auth,
  authorize("admin", "charity_admin"),
  patientController.verifyPatient
);

module.exports = router;
