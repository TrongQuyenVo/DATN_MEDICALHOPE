// models/PatientAssistance.js
const mongoose = require("mongoose");

const PatientAssistanceSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    requestType: {
      type: String,
      enum: [
        "medical_treatment",
        "medication",
        "equipment",
        "surgery",
        "emergency",
        "rehabilitation",
        "other",
      ],
      required: true,
    },
    title: {
      // 🆕 THÊM
      type: String,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    medicalCondition: {
      // 🆕 THÊM
      type: String,
      required: true,
    },
    requestedAmount: {
      type: Number,
      required: true,
      min: 100000,
    },
    urgency: {
      // 🆕 THÊM
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true,
    },
    supportStartDate: {
      type: Date,
      required: true,
    },
    supportEndDate: {
      type: Date,
      required: true,
    },
    contactPhone: {
      // 🆕 THÊM
      type: String,
      required: true,
    },
    raisedAmount: {
      type: Number,
      default: 0,
    },
    remainingAmount: {
      type: Number,
      default: function () {
        return this.requestedAmount;
      },
    },
    // Track withdrawals done by admins to pay the patient
    withdrawals: [
      {
        amount: { type: Number, required: true },
        adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    withdrawnAmount: { type: Number, default: 0 },
    attachments: [
      {
        // 🆕 THÊM CHO FILES
        filename: String,
        path: String,
        size: Number,
      },
    ],
    donationIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Donation",
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "in_progress", "completed", "rejected"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

PatientAssistanceSchema.pre("save", function (next) {
  this.remainingAmount = Math.max(0, this.requestedAmount - this.raisedAmount);
  next();
});

module.exports = mongoose.model("PatientAssistance", PatientAssistanceSchema);
