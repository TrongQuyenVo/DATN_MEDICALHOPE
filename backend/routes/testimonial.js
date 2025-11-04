const express = require("express");
const {
  getTestimonials,
  createTestimonial,
  deleteTestimonial,
  updateVisibility,
  likeTestimonial, // 👈 thêm
} = require("../controllers/testimonialController.js");

const router = express.Router();

// 🟢 Lấy danh sách tất cả đánh giá
router.get("/", getTestimonials);

// 🟡 Gửi đánh giá mới
router.post("/", createTestimonial);

// 🔴 Xóa (admin)
router.delete("/:id", deleteTestimonial);

// 🟠 Cập nhật trạng thái hiển thị (admin)
router.put("/:id/visibility", updateVisibility);

// ❤️ Thả tim
router.put("/:id/like", likeTestimonial);

module.exports = router;
