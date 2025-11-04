// models/CharityOrg.js
const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema({
  email: String,
  phone: String,
});

const ResourcesSchema = new mongoose.Schema({
  funds: {
    type: Number,
    default: 0,
  },
  items: [
    {
      name: String,
      quantity: Number,
      unit: String,
      expiryDate: Date,
    },
  ],
});

const CharityOrgSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    contact: ContactSchema,
    description: String,
    adminUserIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    verifiedPatients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
      },
    ],
    resources: ResourcesSchema,
    totalDonations: {
      type: Number,
      default: 0,
    },
    totalDonationsReceived: {
      type: Number,
      default: 0,
    },
    totalPatientsHelped: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CharityOrg", CharityOrgSchema);
