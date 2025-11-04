const express = require("express");
const { auth } = require("../middleware/auth");
const notificationController = require("../controllers/notificationController");

const router = express.Router();

router.get("/", auth, notificationController.getNotifications);

router.patch("/:id/read", auth, notificationController.markAsRead);

router.patch("/read-all", auth, notificationController.markAllAsRead);

module.exports = router;
