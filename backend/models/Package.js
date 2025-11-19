const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    specialty: { type: String, required: true },
    shortDescription: { type: String, required: true },
    description: { type: String, required: true },
    conditions: { type: String, required: true },
    image: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Package", packageSchema);
