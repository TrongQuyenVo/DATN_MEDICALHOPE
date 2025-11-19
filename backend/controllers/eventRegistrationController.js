// controllers/eventRegistrationController.js
const Event = require("../models/Event");
const EventRegistration = require("../models/EventRegistration");

exports.registerForEvent = async (req, res) => {
  const { fullName, phone, email } = req.body;
  const { id } = req.params;

  try {
    // Kiểm tra event tồn tại
    const event = await Event.findById(id);
    if (!event)
      return res.status(404).json({ message: "Sự kiện không tồn tại" });

    // Kiểm tra trùng số điện thoại (tránh spam)
    const existing = await EventRegistration.findOne({ eventId: id, phone });
    if (existing)
      return res
        .status(400)
        .json({ message: "Bạn đã đăng ký sự kiện này rồi!" });

    // Tạo đăng ký
    const registration = new EventRegistration({
      eventId: id,
      fullName,
      phone,
      email,
    });
    await registration.save();

    // Tăng participants
    event.participants += 1;
    await event.save();

    res
      .status(201)
      .json({ message: "Đăng ký thành công!", data: registration });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.getRegistrationsByEvent = async (req, res) => {
  try {
    const registrations = await EventRegistration.find({
      eventId: req.params.id,
    }).sort({ registeredAt: -1 });
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getAllRegistrations = async (req, res) => {
  try {
    const registrations = await EventRegistration.find()
      .sort({ registeredAt: -1 })
      .populate("eventId", "title"); // Lấy thêm tên sự kiện (tùy chọn)

    res.status(200).json(registrations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
