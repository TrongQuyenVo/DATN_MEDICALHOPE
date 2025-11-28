// routes/donations.js
const express = require("express");
const { auth, authorize } = require("../middleware/auth"); 
const donationController = require("../controllers/donationController");

const router = express.Router();

router.post("/", donationController.createDonation);

router.get(
  "/",
  auth,
  authorize("admin", "charity_admin", "patient"), 
  donationController.getDonations
);

router.post("/confirmed", donationController.createConfirmedDonation);

module.exports = router;
