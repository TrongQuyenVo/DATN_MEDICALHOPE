// models/Registration.js
const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    packageId: { type: String, required: true },
    packageTitle: { type: String, required: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    dob: { type: String, required: true },
    gender: String,
    address: { type: String, required: true },
    healthIssue: { type: String, required: true },

    // Lưu URL của file (tất cả nằm trong /uploads)
    identityCard: [{ type: String, required: true }],
    povertyCertificate: [String],
    medicalRecords: [String],
    dischargePaper: [String],

    commitment: { type: Boolean, default: true },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "processing"],
      default: "pending",
    },
    rejectReason: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Registration", registrationSchema);
