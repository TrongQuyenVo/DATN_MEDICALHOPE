// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ProfileSchema = new mongoose.Schema({
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ["male", "female", "other"],
  },
  address: String,
  insurance: String,
  occupation: String,
});

const UserSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["patient", "doctor", "admin", "charity_admin"],
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    passwordHash: {
      type: String,
      required: true,
      minlength: 6,
    },
    avatar: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    profile: ProfileSchema,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

module.exports = mongoose.model("User", UserSchema);
