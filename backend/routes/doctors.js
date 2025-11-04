const express = require("express");
const { auth, authorize } = require("../middleware/auth");
const doctorController = require("../controllers/doctorController");

const router = express.Router();

router.get(
  "/profile",
  auth,
  authorize("doctor"),
  doctorController.getDoctorProfile
);

router.put(
  "/profile",
  auth,
  authorize("doctor"),
  doctorController.updateDoctorProfile
);

// Cập nhật lịch rảnh
router.put("/availability", auth, doctorController.updateDoctorAvailability);

router.get("/", doctorController.getAllDoctors);

router.get("/:id/availability", doctorController.getDoctorAvailability);

module.exports = router;
