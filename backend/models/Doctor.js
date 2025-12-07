// models/Doctor.js
const mongoose = require("mongoose");

const DoctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    specialty: {
      type: String,
      required: true,
    },
    availableSlots: [
      {
        date: { type: String, required: true },
        times: [{ type: String }],
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    totalPatients: { type: Number, default: 0 },
    volunteerHours: { type: Number, default: 0 },
    license: {
      type: String,
      required: true,
      unique: true,
    },
    experience: {
      type: Number,
      required: true,
    },
    isVolunteer: {
      type: Boolean,
      default: false,
    },
    telehealthEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Doctor", DoctorSchema);
