// routes/donations.js (updated: added return and ipn routes)
const express = require("express");
const { auth, authorize } = require("../middleware/auth");
const donationController = require("../controllers/donationController");

const router = express.Router();

router.post("/", donationController.createDonation); // Optional auth for guests?

// Return URL handler (no auth, public)
router.get("/vnpay-return", donationController.handleVnpayReturn);

// IPN handler (no auth, server-to-server)
// SỬA THÀNH GET
router.get("/vnpay-ipn", donationController.handleVnpayIpn);

router.get(
  "/",
  auth,
  authorize("admin", "charity_admin", "patient"),
  donationController.getDonations
);

module.exports = router;
