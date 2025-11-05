const Patient = require("../models/Patient");

// Create patient profile (after user registers as patient)
exports.createPatientProfile = async (req, res) => {
  try {
    const { economicStatus, medicalHistory, currentCondition, supportNeeded } = req.body;

    // Kiểm tra xem đã tồn tại profile chưa
    const existingPatient = await Patient.findOne({ userId: req.user._id });
    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: "Patient profile already exists",
      });
    }

    const patient = await Patient.create({
      userId: req.user._id,
      economicStatus,
      medicalHistory,
      currentCondition,
      supportNeeded,
      isVerified: false, // Mặc định chưa xác minh
    });

    await patient.populate("userId", "fullName email phone avatar");

    res.status(201).json({
      success: true,
      message: "Patient profile created successfully",
      patient,
    });
  } catch (error) {
    console.error("Create patient profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

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

    if (createdAfter || createdBefore) {
      query.createdAt = {};
      if (createdAfter) query.createdAt.$gte = new Date(createdAfter);
      if (createdBefore) {
        const end = new Date(createdBefore);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const patients = await Patient.find(query)
      .populate({
        path: "userId",
        select: "fullName email phone avatar profile", // THÊM profile
      })
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
    res.status(500).json({ success: false, message: "Server error" });
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
