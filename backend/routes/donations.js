// routes/donations.js
const express = require("express");
const { auth, authorize } = require("../middleware/auth"); // THÊM authorize
const donationController = require("../controllers/donationController");

const router = express.Router();

router.post("/", auth, donationController.createDonation);

router.get(
  "/",
  auth,
  authorize("admin", "charity_admin", "patient"), // CHO PHÉP CẢ 3
  donationController.getDonations
);

router.patch(
  "/:id/status",
  auth,
  authorize("admin", "charity_admin"),
  donationController.updateDonationStatus
);

module.exports = router;
