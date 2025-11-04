const express = require("express");
const { auth, authorize } = require("../middleware/auth");
const patientController = require("../controllers/patientController");

const router = express.Router();

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

router.get(
  "/",
  auth,
  authorize("admin", "charity_admin", "doctor"),
  patientController.getAllPatients
);

router.patch(
  "/:id/verify",
  auth,
  authorize("admin", "charity_admin"),
  patientController.verifyPatient
);

module.exports = router;
