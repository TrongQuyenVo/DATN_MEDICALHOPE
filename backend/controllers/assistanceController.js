const PatientAssistance = require("../models/PatientAssistance");
const Patient = require("../models/Patient");

// 🆕 TẠO YÊU CẦU HỖ TRỢ
exports.createAssistanceRequest = async (req, res) => {
  try {
    console.log("📥 Received data:", req.body); // DEBUG
    console.log("📎 Files:", req.files); // DEBUG

    // 🔍 TÌM PATIENT
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // 💾 TẠO ASSISTANCE REQUEST
    const assistanceData = {
      patientId: patient._id,
      requestType: req.body.requestType,
      title: req.body.title, // THÊM TITLE
      description: req.body.description,
      requestedAmount: parseInt(req.body.requestedAmount),
      urgency: req.body.urgency, // THÊM URGENCY
      contactPhone: req.body.contactPhone, // THÊM PHONE
      medicalCondition: req.body.medicalCondition, // THÊM CONDITION
      attachments: req.files
        ? req.files.map((file) => ({
            originalName: file.originalname,
            filePath: file.path.replace(/\\/g, "/"),
            mimeType: file.mimetype,
          }))
        : [],
      status: "pending",
    };

    const assistance = await PatientAssistance.create(assistanceData);

    // 📎 XỬ LÝ FILES (NẾU CÓ)
    if (req.files && req.files.length > 0) {
      console.log("Files uploaded:", req.files);
    }

    // 👤 POPULATE DATA
    await assistance.populate({
      path: "patientId",
      populate: {
        path: "userId",
        select: "fullName phone profile.dateOfBirth profile.address",
      },
    });

    res.status(201).json({
      success: true,
      message: "Assistance request created successfully",
      data: assistance,
    });
  } catch (error) {
    console.error("❌ Create assistance error:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
};

// 📋 LẤY TẤT CẢ ASSISTANCE REQUESTS
exports.getAssistances = async (req, res) => {
  try {
    const { limit = 10, page = 1, status, patientId } = req.query;

    let query = {};
    if (status) query.status = status;

    // --- CHANGED: nếu user là patient thì ép lọc theo patientId tương ứng,
    // nếu client gửi patientId có thể là User._id hoặc Patient._id => xử lý cả 2
    if (req.user && req.user.role === "patient") {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (patient) {
        query.patientId = patient._id;
      }
    } else if (patientId) {
      // thử tìm Patient nếu client gửi userId
      const patientDoc = await Patient.findOne({ userId: patientId });
      if (patientDoc) {
        query.patientId = patientDoc._id;
      } else {
        // fallback: dùng trực tiếp (trường hợp client đã gửi Patient._id)
        query.patientId = patientId;
      }
    }

    const assistances = await PatientAssistance.find(query)
      .populate({
        path: "patientId",
        populate: {
          path: "userId",
          select: "fullName phone profile.dateOfBirth profile.address",
        },
      })
      .populate("approvedBy", "fullName email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PatientAssistance.countDocuments(query);

    res.json({
      success: true,
      data: assistances,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get assistances error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// 📋 LẤY DANH SÁCH YÊU CẦU HỖ TRỢ CÔNG KHAI
exports.getPublicAssistances = async (req, res) => {
  try {
    const assistances = await PatientAssistance.find({ status: "approved" })
      .populate({
        path: "patientId",
        populate: {
          path: "userId",
          select: "fullName phone profile.dateOfBirth profile.address",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: assistances,
      count: assistances.length,
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách yêu cầu hỗ trợ công khai:", error); // Log chi tiết lỗi
    res.status(500).json({
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

// 🆕 LẤY CHI TIẾT YÊU CẦU HỖ TRỢ THEO ID
exports.getAssistanceById = async (req, res) => {
  try {
    const { id } = req.params;

    const assistance = await PatientAssistance.findById(id)
      .populate({
        path: "patientId",
        populate: {
          path: "userId",
          select: "fullName phone profile.dateOfBirth profile.address",
        },
      })
      .populate("approvedBy", "fullName");

    if (!assistance) {
      return res.status(404).json({
        success: false,
        message: "Yêu cầu hỗ trợ không tồn tại",
      });
    }

    res.json({
      success: true,
      data: assistance,
    });
  } catch (error) {
    console.error("Get assistance by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

// 🔄 CẬP NHẬT STATUS
exports.updateAssistanceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const assistance = await PatientAssistance.findByIdAndUpdate(
      req.params.id,
      {
        status,
        approvedBy: req.user._id,
        updatedAt: new Date(),
      },
      { new: true }
    ).populate({
      path: "patientId",
      populate: {
        path: "userId",
        select: "fullName phone profile.dateOfBirth profile.address",
      },
    });

    if (!assistance) {
      return res.status(404).json({
        success: false,
        message: "Assistance request not found",
      });
    }

    res.json({
      success: true,
      message: `Status updated to ${status}`,
      data: assistance,
    });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.deleteAssistance = async (req, res) => {
  try {
    console.log("Xóa yêu cầu hỗ trợ với ID:", req.params.id); // Log ID
    const assistance = await PatientAssistance.findByIdAndDelete(req.params.id);
    if (!assistance) {
      return res.status(404).json({
        success: false,
        message: "Yêu cầu không tồn tại",
      });
    }

    res.json({
      success: true,
      message: "Đã xóa yêu cầu hỗ trợ",
    });
  } catch (error) {
    console.error("Delete assistance error:", error); // Log lỗi chi tiết
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};
