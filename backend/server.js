// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const http = require("http");
const socketIo = require("socket.io");
const morgan = require("morgan");
const { auth, authorize } = require("./middleware/auth");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  },
});

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const patientRoutes = require("./routes/patients");
const doctorRoutes = require("./routes/doctors");
const appointmentRoutes = require("./routes/appointments");
const donationRoutes = require("./routes/donations");
const charityRoutes = require("./routes/charities");
const notificationRoutes = require("./routes/notifications");
const chatbotRoutes = require("./routes/chatbot");
const assistanceRoutes = require("./routes/assistance");
const partnerRoutes = require("./routes/partner");
const testimonialRoutes = require("./routes/testimonial");
const analyticsRoutes = require("./routes/analytics");
const adminRoutes = require("./routes/admin");

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: [/http:\/\/localhost:\d+$/],
    credentials: true,
  })
);
app.use(morgan("dev"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Static files
app.use("/uploads", express.static("uploads"));

// Database
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/medical-charity",
  { useNewUrlParser: true, useUnifiedTopology: true }
);
mongoose.connection.on("connected", () => console.log("Connected to MongoDB"));
mongoose.connection.on("error", (err) => console.error("MongoDB error:", err));

// Socket.io
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("join", (userId) => socket.join(userId));
  socket.on("disconnect", () => console.log("User disconnected:", socket.id));
});
app.set("io", io);

// === TẤT CẢ ROUTES ĐƯỢC ĐĂNG KÝ TRƯỚC ===
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/charities", charityRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/assistance", assistanceRoutes);
app.use("/api/partners", partnerRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use(
  "/api/analytics",
  auth,
  authorize("admin", "charity_admin"),
  analyticsRoutes
);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler – ĐẶT CUỐI CÙNG!
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };
