// utils/notifications.js
const Notification = require("../models/Notification");

const createNotification = async (userId, type, title, message, io) => {
  try {
    const notification = new Notification({
      userId,
      type,
      title,
      message,
    });

    await notification.save();

    // Send real-time notification via Socket.io
    if (io) {
      io.to(userId.toString()).emit("notification", {
        id: notification._id,
        type,
        title,
        message,
        createdAt: notification.createdAt,
      });
    }

    return notification;
  } catch (error) {
    console.error("Create notification error:", error);
  }
};

const notificationTypes = {
  APPOINTMENT_CREATED: "appointment",
  APPOINTMENT_CONFIRMED: "appointment",
  APPOINTMENT_REMINDER: "reminder",
  DONATION_RECEIVED: "donation",
  ASSISTANCE_APPROVED: "system",
  SYSTEM_ALERT: "alert",
};

module.exports = {
  createNotification,
  notificationTypes,
};
