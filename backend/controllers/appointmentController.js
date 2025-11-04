const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const moment = require("moment");

exports.createAppointment = async (req, res) => {
  try {
    console.log("🧠 Incoming appointment request:", req.body);
    const { doctorId, date, time, appointmentType, patientNotes } = req.body;
    const userId = req.user.id;

    // Kiểm tra dữ liệu đầu vào
    if (!doctorId || !date || !time || !appointmentType) {
      console.log("❌ Missing required fields");
      return res
        .status(400)
        .json({ success: false, message: "Thiếu thông tin bắt buộc" });
    }

    // Tìm thông tin bệnh nhân
    console.log("🔍 Finding patient for userId:", userId);
    const patient = await Patient.findOne({ userId }).populate("userId");
    if (!patient) {
      console.log("❌ Patient not found");
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy hồ sơ bệnh nhân" });
    }
    const patientId = patient._id;

    // Tìm bác sĩ
    console.log("🔍 Finding doctor with ID:", doctorId);
    const doctor = await Doctor.findById(doctorId).populate("userId");
    if (!doctor) {
      console.log("❌ Doctor not found");
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy bác sĩ" });
    }

    // Kiểm tra slot
    console.log("🔍 Checking available slot for date:", date, "time:", time);
    const slot = doctor.availableSlots.find(
      (s) => s.date === date && s.times.includes(time)
    );
    if (!slot) {
      console.log("❌ Slot not available");
      return res
        .status(400)
        .json({ success: false, message: "Khung giờ không khả dụng" });
    }

    // Tạo lịch hẹn
    console.log("📅 Creating appointment...");
    const scheduledTime = new Date(`${date}T${time}:00`);
    if (isNaN(scheduledTime.getTime())) {
      console.log("❌ Invalid scheduledTime");
      return res
        .status(400)
        .json({ success: false, message: "Thời gian lịch hẹn không hợp lệ" });
    }

    const appointment = await Appointment.create({
      doctorId,
      patientId,
      appointmentType,
      scheduledTime,
      status: "scheduled",
      patientNotes: patientNotes || "",
    });

    // Cập nhật slot
    console.log("🔄 Updating doctor available slots...");
    slot.times = slot.times.filter((t) => t !== time);
    if (slot.times.length === 0) {
      doctor.availableSlots = doctor.availableSlots.filter(
        (s) => s.date !== date
      );
    }
    await doctor.save();

    console.log("✅ Appointment created successfully:", appointment._id);
    res.status(201).json({
      success: true,
      message: "Đặt lịch hẹn thành công",
      appointment,
    });
  } catch (error) {
    console.error("❌ Lỗi tạo lịch hẹn:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Lỗi server" });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user.id;
    const role = req.user.role;
    let filter = {};

    if (role === "patient") {
      const patient = await Patient.findOne({ userId });
      if (!patient) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy hồ sơ bệnh nhân" });
      }
      filter.patientId = patient._id;
    }
    if (role === "doctor") {
      const doctor = await Doctor.findOne({ userId });
      if (!doctor) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy hồ sơ bác sĩ" });
      }
      filter.doctorId = doctor._id;
    }

    const total = await Appointment.countDocuments(filter);
    const appointments = await Appointment.find(filter)
      .populate({
        path: "doctorId",
        populate: { path: "userId", select: "fullName email" },
      })
      .populate({
        path: "patientId",
        populate: { path: "userId", select: "fullName email" },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      appointments,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách lịch hẹn:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi lấy lịch hẹn" });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    console.log("🧠 Updating appointment status:", req.params.id, req.body);
    const { status, doctorNotes, prescriptions, testsOrdered } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      console.log("❌ Appointment not found");
      return res
        .status(404)
        .json({ success: false, message: "Lịch hẹn không tồn tại" });
    }

    // Kiểm tra trạng thái hợp lệ
    const validStatuses = [
      "scheduled",
      "confirmed",
      "in_progress",
      "completed",
      "cancelled",
      "no_show",
    ];
    if (!validStatuses.includes(status)) {
      console.log("❌ Invalid status");
      return res
        .status(400)
        .json({ success: false, message: "Trạng thái không hợp lệ" });
    }

    // Kiểm tra trạng thái không cho phép
    if (appointment.status === "confirmed" && status === "cancelled") {
      console.log("❌ Cannot cancel a confirmed appointment");
      return res
        .status(400)
        .json({
          success: false,
          message: "Không thể hủy lịch hẹn đã xác nhận",
        });
    }
    if (appointment.status === "cancelled" && status === "confirmed") {
      console.log("❌ Cannot confirm a cancelled appointment");
      return res
        .status(400)
        .json({
          success: false,
          message: "Không thể xác nhận lịch hẹn đã hủy",
        });
    }

    // Kiểm tra quyền
    const userRole = req.user.role;
    const userId = req.user._id;
    if (userRole === "doctor") {
      const doctor = await Doctor.findOne({ userId });
      if (appointment.doctorId.toString() !== doctor._id.toString()) {
        console.log("❌ Doctor unauthorized");
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền cập nhật lịch hẹn này",
        });
      }
    } else if (userRole === "patient") {
      const patient = await Patient.findOne({ userId });
      if (appointment.patientId.toString() !== patient._id.toString()) {
        console.log("❌ Patient unauthorized");
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền cập nhật lịch hẹn này",
        });
      }
      if (status !== "cancelled") {
        console.log("❌ Patient can only cancel");
        return res.status(403).json({
          success: false,
          message: "Bệnh nhân chỉ có thể hủy lịch hẹn",
        });
      }
    } else if (userRole !== "admin" && userRole !== "charity_admin") {
      console.log("❌ Unauthorized role");
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thực hiện hành động này",
      });
    }

    // Kiểm tra thời gian
    if (new Date(appointment.scheduledTime) < new Date()) {
      console.log("❌ Appointment expired");
      return res.status(400).json({
        success: false,
        message: "Lịch hẹn đã quá thời gian, không thể cập nhật trạng thái",
      });
    }

    // Cập nhật trạng thái và các trường khác
    appointment.status = status;
    if (doctorNotes) appointment.doctorNotes = doctorNotes;
    if (prescriptions) appointment.prescriptions = prescriptions;
    if (testsOrdered) appointment.testsOrdered = testsOrdered;

    // Thêm lại slot nếu hủy/từ chối
    if (status === "cancelled") {
      console.log("🔄 Restoring slot for cancelled appointment...");
      const doctor = await Doctor.findById(appointment.doctorId);
      if (doctor) {
        const date = moment(appointment.scheduledTime).format("YYYY-MM-DD");
        const time = moment(appointment.scheduledTime).format("HH:mm");
        let slot = doctor.availableSlots.find((s) => s.date === date);
        if (slot) {
          if (!slot.times.includes(time)) {
            slot.times.push(time);
            slot.times.sort();
          }
        } else {
          doctor.availableSlots.push({ date, times: [time], isActive: true });
        }
        await doctor.save();
      }
    }

    await appointment.save();

    // Gửi thông báo qua socket.io
    console.log(
      "📡 Emitting socket.io event for patient:",
      appointment.patientId.toString()
    );
    const io = req.app.get("io");
    io.to(appointment.patientId.toString()).emit("appointmentStatusUpdate", {
      appointmentId: appointment._id,
      status,
    });

    console.log("✅ Appointment status updated successfully:", appointment._id);
    res.json({
      success: true,
      message: "Cập nhật trạng thái lịch hẹn thành công",
      appointment,
    });
  } catch (error) {
    console.error("❌ Lỗi cập nhật trạng thái lịch hẹn:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Lỗi server" });
  }
};

exports.getAvailability = async (req, res) => {
  try {
    console.log("🧠 Fetching availability for doctor:", req.params.doctorId);
    const { doctorId } = req.params;
    const { date } = req.query;
    if (!date) {
      console.log("❌ Missing date query");
      return res.status(400).json({ success: false, message: "Yêu cầu ngày" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      console.log("❌ Doctor not found");
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy bác sĩ" });
    }

    const dayOfWeek = moment(date).day();
    const daySlot = doctor.availableSlots.find(
      (s) => s.dayOfWeek === dayOfWeek && s.isActive
    );
    if (!daySlot) {
      console.log("❌ No available slots for day");
      return res.json({
        success: true,
        availableTimes: [],
        unavailableTimes: [],
      });
    }

    const times = [];
    let current = moment(daySlot.startTime, "HH:mm");
    const end = moment(daySlot.endTime, "HH:mm");
    while (current.isBefore(end)) {
      times.push(current.format("HH:mm"));
      current.add(30, "minutes");
    }

    const startDate = moment(date).startOf("day").toDate();
    const endDate = moment(date).endOf("day").toDate();
    const appointments = await Appointment.find({
      doctorId: doctor._id,
      scheduledTime: { $gte: startDate, $lte: endDate },
      status: { $in: ["scheduled", "confirmed", "in_progress"] },
    });

    const unavailableTimes = appointments.map((apt) =>
      moment(apt.scheduledTime).format("HH:mm")
    );
    const availableTimes = times.filter(
      (time) => !unavailableTimes.includes(time)
    );

    console.log("✅ Availability fetched:", {
      availableTimes,
      unavailableTimes,
    });
    res.json({ success: true, availableTimes, unavailableTimes });
  } catch (error) {
    console.error("❌ Lỗi lấy khung giờ khả dụng:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

exports.cancelAppointment = async (req, res) => {
  try {
    console.log("🧠 Cancelling appointment:", req.params.id);
    const { id } = req.params;
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      console.log("❌ Appointment not found");
      return res
        .status(404)
        .json({ success: false, message: "Lịch hẹn không tồn tại" });
    }

    // Kiểm tra trạng thái không cho phép
    if (appointment.status === "confirmed") {
      console.log("❌ Cannot cancel a confirmed appointment");
      return res
        .status(400)
        .json({
          success: false,
          message: "Không thể hủy lịch hẹn đã xác nhận",
        });
    }

    // Kiểm tra quyền
    const userRole = req.user.role;
    const userId = req.user._id;
    if (userRole === "patient") {
      const patient = await Patient.findOne({ userId });
      if (appointment.patientId.toString() !== patient._id.toString()) {
        console.log("❌ Patient unauthorized");
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền hủy lịch hẹn này",
        });
      }
    } else if (userRole !== "admin" && userRole !== "charity_admin") {
      console.log("❌ Unauthorized role");
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền hủy lịch hẹn này",
      });
    }

    // Kiểm tra thời gian
    if (new Date(appointment.scheduledTime) < new Date()) {
      console.log("❌ Appointment expired");
      return res.status(400).json({
        success: false,
        message: "Lịch hẹn đã quá thời gian, không thể hủy",
      });
    }

    // Cập nhật trạng thái
    appointment.status = "cancelled";
    await appointment.save();

    // Thêm lại slot
    console.log("🔄 Restoring slot for cancelled appointment...");
    const doctor = await Doctor.findById(appointment.doctorId);
    if (doctor) {
      const date = moment(appointment.scheduledTime).format("YYYY-MM-DD");
      const time = moment(appointment.scheduledTime).format("HH:mm");
      let slot = doctor.availableSlots.find((s) => s.date === date);
      if (slot) {
        if (!slot.times.includes(time)) {
          slot.times.push(time);
          slot.times.sort();
        }
      } else {
        doctor.availableSlots.push({ date, times: [time], isActive: true });
      }
      await doctor.save();
    }

    // Gửi thông báo qua socket.io
    console.log(
      "📡 Emitting socket.io event for patient:",
      appointment.patientId.toString()
    );
    const io = req.app.get("io");
    io.to(appointment.patientId.toString()).emit("appointmentStatusUpdate", {
      appointmentId: appointment._id,
      status: "cancelled",
    });

    console.log("✅ Appointment cancelled successfully:", appointment._id);
    res.status(200).json({
      success: true,
      message: "Hủy lịch hẹn thành công",
      appointment,
    });
  } catch (error) {
    console.error("❌ Lỗi hủy lịch hẹn:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Lỗi server" });
  }
};
