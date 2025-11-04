const Patient = require("../models/Patient");

// Get patient profile
exports.getPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id })
      .populate("userId", "-passwordHash")
      .populate("supportReceived");

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found",
      });
    }

    res.json({
      success: true,
      patient,
    });
  } catch (error) {
    console.error("Get patient profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update patient profile
exports.updatePatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findOneAndUpdate(
      { userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found",
      });
    }

    res.json({
      success: true,
      message: "Patient profile updated successfully",
      patient,
    });
  } catch (error) {
    console.error("Update patient profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all patients (for admin/charity/doctor)
// controllers/patientController.js

exports.getAllPatients = async (req, res) => {
  try {
    const {
      limit = 10,
      page = 1,
      verified,
      economicStatus,
      createdAfter,
      createdBefore,
    } = req.query;

    let query = {};

    if (verified !== undefined) query.isVerified = verified === "true";
    if (economicStatus) query.economicStatus = economicStatus;

    // THÊM FILTER THEO NGÀY
    if (createdAfter || createdBefore) {
      query.createdAt = {};
      if (createdAfter) {
        query.createdAt.$gte = new Date(createdAfter);
      }
      if (createdBefore) {
        // Đặt trước 1 ngày để bao gồm cả ngày hiện tại
        const end = new Date(createdBefore);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const patients = await Patient.find(query)
      .populate("userId", "fullName email phone avatar")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Patient.countDocuments(query);

    res.json({
      success: true,
      patients,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get patients error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Verify patient
exports.verifyPatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.json({
      success: true,
      message: "Patient verified successfully",
      patient,
    });
  } catch (error) {
    console.error("Verify patient error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
