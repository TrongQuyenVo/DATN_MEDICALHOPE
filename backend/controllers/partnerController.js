const Partner = require("../models/Partner");
const multer = require("multer");
const path = require("path");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Create a new partner
const createPartner = [
  upload.single("logo"),
  async (req, res) => {
    try {
      const {
        name,
        type,
        category,
        website,
        isActive,
        phone,
        description,
        location,
        schedule,
        organizer,
        departure,
        destination,
        email,
        activities,
      } = req.body;

      // Basic validation
      if (!name || !type || !category) {
        return res
          .status(400)
          .json({ message: "Tên, loại và danh mục là bắt buộc" });
      }

      // Validate type
      const validTypes = [
        "transportation",
        "food_distribution",
        "organization",
      ];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ message: "Loại không hợp lệ" });
      }

      // Xử lý activities nếu có
      let activitiesArray = [];
      if (activities) {
        activitiesArray = activities
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item);
      }

      const details = {
        ...(phone && { phone }),
        ...(description && { description }),
        ...(location && { location }),
        ...(schedule && { schedule }),
        ...(organizer && { organizer }),
        ...(departure && { departure }),
        ...(destination && { destination }),
        ...(email && { email }),
        ...(activitiesArray.length > 0 && { activities: activitiesArray }),
      };

      const partner = new Partner({
        name,
        type,
        category,
        website,
        logo: req.file ? `/uploads/${req.file.filename}` : undefined,
        details,
        isActive: isActive === "true",
      });

      await partner.save();
      res.status(201).json({ message: "Thêm đối tác thành công", partner });
    } catch (error) {
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  },
];

// Update a partner by ID
const updatePartner = [
  upload.single("logo"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        type,
        category,
        website,
        isActive,
        phone,
        description,
        location,
        schedule,
        organizer,
        departure,
        destination,
        email,
        activities,
      } = req.body;

      // Validate type if provided
      if (type) {
        const validTypes = [
          "transportation",
          "food_distribution",
          "organization",
        ];
        if (!validTypes.includes(type)) {
          return res.status(400).json({ message: "Loại không hợp lệ" });
        }
      }

      const partner = await Partner.findById(id);
      if (!partner) {
        return res.status(404).json({ message: "Không tìm thấy đối tác" });
      }

      // Xử lý activities nếu có
      let activitiesArray = [];
      if (activities) {
        activitiesArray = activities
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item);
      }

      const details = {
        ...(phone && { phone }),
        ...(description && { description }),
        ...(location && { location }),
        ...(schedule && { schedule }),
        ...(organizer && { organizer }),
        ...(departure && { departure }),
        ...(destination && { destination }),
        ...(email && { email }),
        ...(activitiesArray.length > 0 && { activities: activitiesArray }),
      };

      // Update fields if provided
      if (name) partner.name = name;
      if (type) partner.type = type;
      if (category) partner.category = category;
      if (website) partner.website = website;
      if (req.file) partner.logo = `/uploads/${req.file.filename}`;
      if (details) partner.details = details;
      if (isActive !== undefined) partner.isActive = isActive === "true";

      await partner.save();
      res.status(200).json({ message: "Cập nhật đối tác thành công", partner });
    } catch (error) {
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  },
];

// Delete a partner by ID
const deletePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const partner = await Partner.findById(id);
    if (!partner) {
      return res.status(404).json({ message: "Không tìm thấy đối tác" });
    }

    await partner.deleteOne();
    res.status(200).json({ message: "Xóa đối tác thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Get a single partner by ID
const getPartnerById = async (req, res) => {
  try {
    const { id } = req.params;
    const partner = await Partner.findById(id);
    if (!partner) {
      return res.status(404).json({ message: "Không tìm thấy đối tác" });
    }

    res.status(200).json(partner);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Get all partners with pagination
const getAllPartners = async (req, res) => {
  try {
    const { type, category, page = 1, limit = 10 } = req.query;

    const query = {};
    if (type) query.type = type;
    if (category) query.category = category;

    // Parse pagination
    const pageNum = parseInt(String(page), 10);
    const limitNum = parseInt(String(limit), 10);
    const skip = (pageNum - 1) * limitNum;

    // Get data
    const partners = await Partner.find(query)
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Partner.countDocuments(query);

    // TRẢ VỀ ĐÚNG ĐỊNH DẠNG CÓ PAGINATION
    res.status(200).json({
      data: partners,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

const getAllListPartners = async (req, res) => {
  try {
    const { type, category } = req.query;
    const query = {};

    if (type) query.type = type;
    if (category) query.category = category;

    const partners = await Partner.find(query);
    res.status(200).json(partners);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

module.exports = {
  createPartner,
  updatePartner,
  deletePartner,
  getPartnerById,
  getAllPartners,
  getAllListPartners,
};
