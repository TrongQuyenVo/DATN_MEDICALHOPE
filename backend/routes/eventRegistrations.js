// routes/eventRegistrations.js
const express = require("express");
const router = express.Router();
const registrationController = require("../controllers/eventRegistrationController");

router.post("/:id/register", registrationController.registerForEvent);
router.get(
  "/:id/registrations",
  registrationController.getRegistrationsByEvent
);
router.get("/all", registrationController.getAllRegistrations);
module.exports = router;
