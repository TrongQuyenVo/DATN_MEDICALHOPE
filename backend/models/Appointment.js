// models/Appointment.js
const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    appointmentType: {
      type: String,
      enum: ["consultation", "follow_up", "emergency", "telehealth"],
      default: "consultation",
    },
    scheduledTime: {
      type: Date,
      required: true,
    },
    // Optional: record when the actual clinical exam started/ended
    examStartTime: Date,
    examEndTime: Date,
    // Has the exam duration already been counted toward doctor's volunteer hours?
    hoursAdded: { type: Boolean, default: false },
    status: {
      type: String,
      enum: [
        "scheduled",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      default: "scheduled",
    },
    patientNotes: String,
    doctorNotes: String,
    meetingLink: String,
    reminderSent: {
      type: Boolean,
      default: false,
    },
    prescriptions: [
      {
        medication: String,
        dosage: String,
        frequency: String,
        duration: String,
        instructions: String,
      },
    ],
    testsOrdered: [
      {
        testName: String,
        reason: String,
        priority: {
          type: String,
          enum: ["low", "medium", "high", "urgent"],
          default: "medium",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Appointment", AppointmentSchema);
