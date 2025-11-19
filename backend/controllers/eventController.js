const Event = require("../models/Event");
const upload = require("../middleware/upload");

exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách hoạt động", error });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event)
      return res.status(404).json({ message: "Không tìm thấy hoạt động" });
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy chi tiết hoạt động", error });
  }
};

exports.createEvent = async (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });

    try {
      const data = {
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        image: req.file ? `/uploads/${req.file.filename}` : undefined,
      };
      const newEvent = new Event(data);
      const saved = await newEvent.save();
      res.status(201).json(saved);
    } catch (error) {
      res.status(400).json({ message: "Lỗi tạo sự kiện", error });
    }
  });
};

exports.updateEvent = async (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });

    const data = {
      ...req.body,
      startDate: new Date(req.body.startDate),
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
    };
    if (req.file) data.image = `/uploads/${req.file.filename}`;

    const updated = await Event.findByIdAndUpdate(req.params.id, data, {
      new: true,
    });
    if (!updated) return res.status(404).json({ message: "Không tìm thấy" });
    res.json(updated);
  });
};

exports.deleteEvent = async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);
    if (!deletedEvent)
      return res.status(404).json({ message: "Không tìm thấy hoạt động" });
    res.status(200).json({ message: "Xóa hoạt động thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa hoạt động", error });
  }
};
