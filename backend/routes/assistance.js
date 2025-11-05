const express = require("express");
const multer = require("multer");
const { auth, authorize } = require("../middleware/auth");
const assistanceController = require("../controllers/assistanceController");

const router = express.Router();

// 💾 CẤU HÌNH MULTER
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/assistance/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (
      ["image/jpeg", "image/png", "application/pdf", "text/plain"].includes(
        file.mimetype
      )
    ) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"));
    }
  },
});

router.post(
  "/",
  auth,
  authorize("patient"),
  upload.array("attachments", 5), // Tối đa 5 files
  assistanceController.createAssistanceRequest
);

router.get("/", auth, assistanceController.getAssistances);
router.patch(
  "/:id/status",
  auth,
  authorize("admin", "charity_admin"),
  assistanceController.updateAssistanceStatus
);
// Endpoint công khai cho landing page
router.get("/public", assistanceController.getPublicAssistances);
router.get("/:id", assistanceController.getAssistanceById);

module.exports = router;
