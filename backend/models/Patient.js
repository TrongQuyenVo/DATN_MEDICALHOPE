// models/Patient.js
const mongoose = require("mongoose");

const PatientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    medicalHistory: [
      {
        condition: String,
        diagnosedDate: Date,
        treatment: String,
        notes: String,
      },
    ],
    documents: [
      {
        type: String,
        url: String,
        uploadedAt: Date,
      },
    ],
    supportReceived: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Donation",
      },
    ],
    allergies: [String],
    bloodType: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    emergencyContact: String,
    economicStatus: {
      type: String,
      enum: ["very_poor", "poor", "middle", "good"],
      default: "poor",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Patient", PatientSchema);
