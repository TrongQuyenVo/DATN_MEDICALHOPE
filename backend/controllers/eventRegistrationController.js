// controllers/eventRegistrationController.js
const Event = require("../models/Event");
const EventRegistration = require("../models/EventRegistration");
const { sendEmail } = require("../utils/email");
exports.registerForEvent = async (req, res) => {
  const { fullName, phone, email } = req.body;
  const { id } = req.params;

  try {
    const event = await Event.findById(id);
    if (!event)
      return res.status(404).json({ message: "Sự kiện không tồn tại" });

    const existing = await EventRegistration.findOne({ eventId: id, phone });
    if (existing)
      return res
        .status(400)
        .json({ message: "Bạn đã đăng ký sự kiện này rồi!" });

    const registration = new EventRegistration({
      eventId: id,
      fullName,
      phone,
      email,
    });
    await registration.save();

    // Tăng số lượng người tham gia
    event.participants += 1;
    await event.save();

    // ================== GỬI EMAIL XÁC NHẬN TỰ ĐỘNG ==================
    // Thêm template mới cho sự kiện (bạn có thể tạo riêng hoặc dùng chung)
    const eventConfirmationHtml = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Xác nhận đăng ký</title>
      </head>
      <body style="margin:0; padding:0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color:#2563eb; color:#ffffff; padding:20px; text-align:center; font-size:24px; font-weight:bold;">
                    🎉 Xác nhận đăng ký sự kiện
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:30px; color:#1f2937; line-height:1.6;">
                    <p>Xin chào <strong>${fullName}</strong> 👋,</p>
                    <p>Chúng tôi đã nhận được đăng ký tham gia sự kiện của bạn. Dưới đây là thông tin chi tiết:</p>
                    
                    <!-- Event Card -->
                    <div style="background:#f9f9f9; padding:20px; border-radius:8px; margin:20px 0; border:1px solid #e0e0e0;">
                      <h3 style="margin:0 0 10px 0; color:#2563eb;">📌 ${
                        event.title
                      }</h3>
                      ${
                        event.date
                          ? `<p>⏰ <strong>Thời gian:</strong> ${new Date(
                              event.date
                            ).toLocaleString("vi-VN")}</p>`
                          : ""
                      }
                      ${
                        event.location
                          ? `<p>📍 <strong>Địa điểm:</strong> ${event.location}</p>`
                          : ""
                      }
                      <p>📞 <strong>Số điện thoại liên hệ:</strong> ${phone}</p>
                    </div>

                    <p>Vui lòng đến đúng giờ. Chúng tôi sẽ liên hệ với bạn nếu có thông tin cập nhật thêm 📨.</p>
                    
                    <p style="margin-top:30px;">🙏 Xin cảm ơn bạn đã quan tâm và đăng ký tham gia chương trình ❤️</p>

                    <p style="margin-top:30px; font-size:14px; color:#6b7280;">
                      Trân trọng,<br>
                      <strong>🏥 Đội ngũ tổ chức sự kiện y tế từ thiện</strong>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color:#f1f5f9; text-align:center; padding:15px; font-size:12px; color:#9ca3af;">
                    © ${new Date().getFullYear()} Sự kiện y tế từ thiện. Mọi quyền được bảo lưu.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `;

    // Gửi cho người đăng ký (nếu có email)
    if (email) {
      await sendEmail(
        email,
        `Xác nhận đăng ký: ${event.title}`,
        eventConfirmationHtml
      );
    }

    // Gửi thông báo cho admin (tùy chọn - rất hữu ích)
    await sendEmail(
      process.env.ADMIN_EMAIL || "admin@yourdomain.com", // thêm biến môi trường này
      `Đăng ký mới: ${event.title} - ${fullName}`,
      `
        <h3>Có người vừa đăng ký sự kiện!</h3>
        <ul>
          <li><strong>Họ tên:</strong> ${fullName}</li>
          <li><strong>SĐT:</strong> ${phone}</li>
          <li><strong>Email:</strong> ${email || "Không có"}</li>
          <li><strong>Sự kiện:</strong> ${event.title}</li>
          <li><strong>Thời gian đăng ký:</strong> ${new Date().toLocaleString(
            "vi-VN"
          )}</li>
        </ul>
        <p><a href="https://your-admin-domain.com/admin/registrations">Xem tất cả đăng ký</a></p>
      `
    );
    // ================================================================

    res.status(201).json({
      message: "Đăng ký thành công! Email xác nhận đã được gửi (nếu có email).",
      data: registration,
    });
  } catch (error) {
    console.error("Lỗi khi đăng ký sự kiện:", error);
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
