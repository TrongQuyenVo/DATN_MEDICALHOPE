// routes/appointments.js
const express = require("express");
const { auth } = require("../middleware/auth");
const appointmentController = require("../controllers/appointmentController");

const router = express.Router();

router.post("/", auth, appointmentController.createAppointment);
router.get("/", auth, appointmentController.getAppointments);
router.patch(
  "/:id/status",
  auth,
  appointmentController.updateAppointmentStatus
);
router.get(
  "/availability/:doctorId",
  auth,
  appointmentController.getAvailability
);
router.delete("/:id", auth, appointmentController.cancelAppointment);

module.exports = router;
