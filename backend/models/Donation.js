// models/Donation.js (updated: simplified status, added txnRef)
const mongoose = require("mongoose");

const DonationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },
    assistanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PatientAssistance",
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    // Thêm vào schema
    paymentMethod: {
      type: String,
      enum: ["vnpay", "paypal"],
      required: true,
    },
    paypalOrderId: { type: String }, // Lưu order ID từ PayPal
    paypalCaptureId: { type: String },
    txnRef: { type: String, required: true, unique: true }, // VNPAY transaction ref
    isAnonymous: { type: Boolean, default: false },

    // Donor info
    donorName: { type: String },
    donorEmail: { type: String },
    donorPhone: { type: String },
    message: { type: String },

    status: {
      type: String,
      enum: ["pending", "completed", "failed"], // Removed cancelled, simplified
      default: "completed",
    },
    confirmedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", DonationSchema);
