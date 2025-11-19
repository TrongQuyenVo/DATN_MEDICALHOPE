const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    age: { type: String },
    location: { type: String },
    content: { type: String, required: true },
    treatment: { type: String },
    visible: { type: Boolean, default: true },
    likes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Testimonial", testimonialSchema);