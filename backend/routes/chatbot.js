const express = require("express");
const { auth } = require("../middleware/auth");
const chatbotController = require("../controllers/chatbotController");

const router = express.Router();

router.post("/chat", auth, chatbotController.processChat);

router.get("/history/:sessionId", auth, chatbotController.getChatHistory);

module.exports = router;
