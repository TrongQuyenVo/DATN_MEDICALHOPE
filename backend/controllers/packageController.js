const Package = require("../models/Package");
const upload = require("../middleware/upload"); // <-- dùng chung multer

// GET all
exports.getAllPackages = async (req, res) => {
  try {
    const packages = await Package.find({ isActive: true });
    res.status(200).json(packages);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// CREATE
exports.createPackage = async (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });

    try {
      const data = {
        ...req.body,
        image: req.file ? `/uploads/${req.file.filename}` : undefined,
        isActive: true,
      };
      const newPackage = new Package(data);
      const saved = await newPackage.save();
      res.status(201).json(saved);
    } catch (error) {
      res.status(400).json({ message: "Lỗi tạo gói khám", error });
    }
  });
};

// UPDATE
exports.updatePackage = async (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });

    try {
      const data = { ...req.body };
      if (req.file) {
        data.image = `/uploads/${req.file.filename}`;
      }

      const updated = await Package.findByIdAndUpdate(req.params.id, data, {
        new: true,
      });
      if (!updated) return res.status(404).json({ message: "Không tìm thấy" });

      res.status(200).json(updated);
    } catch (error) {
      res.status(400).json({ message: "Lỗi cập nhật", error });
    }
  });
};

// DELETE
exports.deletePackage = async (req, res) => {
  try {
    await Package.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Xóa thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa" });
  }
};

exports.getPackageById = async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ message: "Không tìm thấy" });
    res.json(pkg);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};
