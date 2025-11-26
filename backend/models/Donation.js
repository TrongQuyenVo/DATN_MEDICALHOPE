// models/Donation.js
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
    paymentMethod: { type: String, enum: ["vnpay"], required: true },
    isAnonymous: { type: Boolean, default: false },

    // Thông tin người ủng hộ (dùng cho cả user và guest)
    donorName: { type: String },
    donorEmail: { type: String },
    donorPhone: { type: String },
    message: { type: String },

    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending", // Thay đổi: mặc định là pending
    },
    confirmedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", DonationSchema);
