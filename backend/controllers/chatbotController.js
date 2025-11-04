const ChatbotLog = require("../models/ChatbotLog");

// Simple chatbot response generator
function generateResponse(message) {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("appointment") ||
    lowerMessage.includes("cuộc hẹn")
  ) {
    return 'Bạn có thể đặt lịch hẹn với bác sĩ thông qua trang "Đặt lịch khám". Tôi có thể giúp bạn tìm bác sĩ phù hợp với chuyên khoa mong muốn.';
  } else if (
    lowerMessage.includes("donation") ||
    lowerMessage.includes("quyên góp")
  ) {
    return 'Cảm ơn bạn muốn quyên góp! Bạn có thể quyên góp tiền, thuốc, hoặc vật dụng y tế. Vui lòng truy cập trang "Quyên góp" để biết thêm chi tiết.';
  } else if (lowerMessage.includes("help") || lowerMessage.includes("giúp")) {
    return "Tôi có thể giúp bạn về: Đặt lịch khám bệnh, Quyên góp, Yêu cầu hỗ trợ y tế, Thông tin về các bác sĩ tình nguyện. Bạn muốn biết thêm về vấn đề gì?";
  } else {
    return "Cảm ơn bạn đã liên hệ! Tôi là trợ lý ảo của nền tảng y tế từ thiện. Tôi có thể giúp bạn đặt lịch khám, quyên góp, hoặc tìm hiểu về các dịch vụ của chúng tôi. Bạn cần hỗ trợ gì?";
  }
}

exports.processChat = async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    let response = generateResponse(message);

    const chatLog = new ChatbotLog({
      userId: req.user._id,
      sessionId,
      message,
      response,
    });

    await chatLog.save();

    res.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const chatLogs = await ChatbotLog.find({
      userId: req.user._id,
      sessionId: req.params.sessionId,
    }).sort({ timestamp: 1 });

    res.json({
      success: true,
      chatLogs,
    });
  } catch (error) {
    console.error("Get chat history error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
