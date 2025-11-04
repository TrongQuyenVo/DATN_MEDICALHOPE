// controllers/authController.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");

exports.register = async (req, res) => {
  try {
    const { role, fullName, email, phone, password, ...additionalData } =
      req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Create user
    const user = new User({
      role,
      fullName,
      email,
      phone,
      passwordHash: password,
    });

    await user.save();

    // Create role-specific profile
    if (role === "patient") {
      const patient = new Patient({
        userId: user._id,
        ...additionalData,
      });
      await patient.save();
    } else if (role === "doctor") {
      const doctor = new Doctor({
        userId: user._id,
        ...additionalData,
      });
      await doctor.save();
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
        profile: user.profile,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    let userProfile = req.user.toObject();

    // Get role-specific data
    if (req.user.role === "patient") {
      const patient = await Patient.findOne({ userId: req.user._id });
      userProfile.patientData = patient;
    } else if (req.user.role === "doctor") {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      userProfile.doctorData = doctor;
    }

    res.json({
      success: true,
      user: userProfile,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
