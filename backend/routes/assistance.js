// routes/assistance.js (hoặc file route tương ứng)
const express = require("express");
const multer = require("multer");
const { auth, authorize } = require("../middleware/auth");
const assistanceController = require("../controllers/assistanceController");

const router = express.Router();

// CẤU HÌNH MULTER - CHỈ CHO PHÉP ẢNH
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/assistance/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = file.originalname.split(".").pop();
    cb(null, `${file.fieldname}-${uniqueSuffix}.${ext}`);
  },
});

// CHỈ CHẤP NHẬN CÁC LOẠI ẢNH
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ được upload file ảnh (JPG, PNG, WebP, GIF)"), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB mỗi file
    files: 5, // tối đa 5 ảnh
  },
  fileFilter,
});

// ROUTE UPLOAD - CHỈ ẢNH
router.post(
  "/",
  auth,
  authorize("patient"),
  upload.array("attachments", 5), // tối đa 5 ảnh
  assistanceController.createAssistanceRequest
);

// Các route khác giữ nguyên...
router.get("/", auth, assistanceController.getAssistances);
router.patch(
  "/:id/status",
  auth,
  authorize("admin"),
  assistanceController.updateAssistanceStatus
);
router.get("/public", assistanceController.getPublicAssistances);
router.get("/:id", assistanceController.getAssistanceById);
router.delete(
  "/:id",
  auth,
  authorize("admin"),
  assistanceController.deleteAssistance
);

module.exports = router;
