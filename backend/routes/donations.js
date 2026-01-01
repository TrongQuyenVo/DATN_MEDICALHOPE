// routes/donations.js (updated: added return and ipn routes)
const express = require("express");
const { auth, authorize } = require("../middleware/auth");
const donationController = require("../controllers/donationController");

const router = express.Router();

router.post("/", donationController.createDonation); // Optional auth for guests?

// Confirm donation by txnRef (idempotent) — used by frontend after redirect
router.get('/confirm-success/:txnRef', donationController.confirmSuccess);

router.get("/paypal-return", donationController.handlePaypalReturn);
router.post(
  "/paypal-webhook",
  express.raw({ type: "application/json" }),
  donationController.handlePaypalWebhook
);
// Return URL handler (no auth, public)
router.get("/vnpay-return", donationController.handleVnpayReturn);

// IPN handler (no auth, server-to-server)
// SỬA THÀNH GET
router.get("/vnpay-ipn", donationController.handleVnpayIpn);

router.get(
  "/",
  auth,
  authorize("admin", "patient"),
  donationController.getDonations
);

module.exports = router;
