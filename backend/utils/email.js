// utils/email.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to,
      subject,
      html,
    });
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Send email error:", error);
  }
};

const emailTemplates = {
  appointmentConfirmation: (patientName, doctorName, appointmentTime) => `
    <h2>Xác nhận lịch hẹn khám bệnh</h2>
    <p>Xin chào ${patientName},</p>
    <p>Lịch hẹn khám bệnh của bạn đã được xác nhận:</p>
    <ul>
      <li><strong>Bác sĩ:</strong> ${doctorName}</li>
      <li><strong>Thời gian:</strong> ${appointmentTime}</li>
    </ul>
    <p>Vui lòng đến đúng giờ. Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.</p>
  `,

  donationThankYou: (donorName, amount, purpose) => `
    <h2>Cảm ơn bạn đã quyên góp</h2>
    <p>Xin chào ${donorName},</p>
    <p>Cảm ơn bạn đã quyên góp ${amount} VND cho mục đích: ${purpose}</p>
    <p>Sự đóng góp của bạn sẽ giúp chúng tôi hỗ trợ tốt hơn những bệnh nhân có hoàn cảnh khó khăn.</p>
    <p>Trân trọng,<br>Đội ngũ Y tế từ thiện</p>
  `,
};

module.exports = {
  sendEmail,
  emailTemplates,
};
