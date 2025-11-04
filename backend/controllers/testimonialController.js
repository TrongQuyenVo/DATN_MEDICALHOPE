import Testimonial from "../models/testimonial.js";

// Lấy tất cả đánh giá
export const getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tạo mới đánh giá
export const createTestimonial = async (req, res) => {
  try {
    const newTestimonial = new Testimonial(req.body);
    const saved = await newTestimonial.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Cập nhật trạng thái hiển thị (admin)
export const updateVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { visible } = req.body;

    const testimonial = await Testimonial.findByIdAndUpdate(
      id,
      { visible },
      { new: true }
    );

    if (!testimonial) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá" });
    }

    res.json({ message: "Đã cập nhật trạng thái hiển thị", testimonial });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xóa đánh giá (admin)
export const deleteTestimonial = async (req, res) => {
  try {
    await Testimonial.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa đánh giá" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ❤️ Thả tim đánh giá
export const likeTestimonial = async (req, res) => {
  try {
    const { id } = req.params;

    const testimonial = await Testimonial.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } }, // tăng 1 tim
      { new: true }
    );

    if (!testimonial) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá" });
    }

    res.json({ message: "Đã thả tim ❤️", testimonial });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
