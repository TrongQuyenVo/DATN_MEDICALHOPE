// filepath: d:\DATN_MEDICALHOPE\backend\routes\notification.js
const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notificationController");

// Import middleware auth
const { auth } = require("../middleware/auth");

router.get("/", auth, getNotifications);

router.put("/:id/read", auth, markAsRead);

router.put("/read-all", auth, markAllAsRead);

module.exports = router;
