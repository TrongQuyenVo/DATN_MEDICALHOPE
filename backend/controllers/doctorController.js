const Doctor = require("../models/Doctor");
const moment = require("moment");
const Appointment = require("../models/Appointment");

// Get doctor profile
exports.getDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id }).populate(
      "userId",
      "-passwordHash"
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    res.json({
      success: true,
      doctor,
    });
  } catch (error) {
    console.error("Get doctor profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update doctor profile
exports.updateDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOneAndUpdate(
      { userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    res.json({
      success: true,
      message: "Doctor profile updated successfully",
      doctor,
    });
  } catch (error) {
    console.error("Update doctor profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all doctors
exports.getAllDoctors = async (req, res) => {
  try {
    const {
      specialty,
      isVolunteer,
      telehealthEnabled,
      limit = 10,
      page = 1,
    } = req.query;
    let query = {};

    if (specialty) query.specialty = specialty;
    if (isVolunteer !== undefined) query.isVolunteer = isVolunteer === "true";
    if (telehealthEnabled !== undefined)
      query.telehealthEnabled = telehealthEnabled === "true";

    const doctors = await Doctor.find(query)
      .populate({
        path: "userId",
        select: "fullName email avatar profile.address", // Lấy address
      })
      .sort({ experience: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Doctor.countDocuments(query);

    // GÁN location từ profile.address
    const formattedDoctors = doctors.map((doc) => {
      const doctor = doc.toObject();
      return {
        ...doctor,
        location: doctor.userId?.profile?.address || "Không xác định",
      };
    });

    res.json({
      success: true,
      doctors: formattedDoctors,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get doctors error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// 🟩 Lấy danh sách giờ rảnh của bác sĩ (dựa trên khai báo thủ công)
exports.getDoctorAvailability = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    const { date } = req.query;

    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    // ✅ Nếu không truyền date -> trả toàn bộ lịch rảnh
    if (!date) {
      const allAvailableSlots = (doctor.availableSlots || [])
        .filter((s) => s.isActive)
        .map((s) => ({
          date: s.date,
          times: s.times,
        }));
      return res.json({ success: true, availableSlots: allAvailableSlots });
    }

    // Nếu có date -> xử lý như cũ
    const targetDate = moment(date).format("YYYY-MM-DD");
    const daySlot = doctor.availableSlots.find(
      (s) => s.date === targetDate && s.isActive
    );

    if (!daySlot) {
      return res.json({ success: true, availableTimes: [] });
    }

    const startDate = moment(date).startOf("day").toDate();
    const endDate = moment(date).endOf("day").toDate();

    const appointments = await Appointment.find({
      doctorId: doctor._id,
      scheduledTime: { $gte: startDate, $lte: endDate },
      status: { $in: ["scheduled", "confirmed", "in_progress"] },
    });

    const bookedTimes = appointments.map((a) =>
      moment(a.scheduledTime).format("HH:mm")
    );
    const availableTimes = daySlot.times.filter(
      (t) => !bookedTimes.includes(t)
    );

    res.json({
      success: true,
      availableTimes,
      totalSlots: daySlot.times.length,
      bookedTimes,
    });
  } catch (error) {
    console.error("Get doctor availability error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🟩 Cập nhật danh sách giờ rảnh (bác sĩ tự khai báo)
exports.updateDoctorAvailability = async (req, res) => {
  try {
    const { availableSlots } = req.body;

    if (!availableSlots || !Array.isArray(availableSlots)) {
      return res.status(400).json({
        success: false,
        message: "Invalid availableSlots format",
      });
    }

    const doctor = await Doctor.findOneAndUpdate(
      { userId: req.user._id },
      { availableSlots },
      { new: true, runValidators: true }
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    res.json({
      success: true,
      message: "Doctor availability updated successfully",
      doctor,
    });
  } catch (error) {
    console.error("Update doctor availability error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
