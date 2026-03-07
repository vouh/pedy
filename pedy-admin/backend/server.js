require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const serviceRoutes = require("./routes/services");
const paymentRoutes = require("./routes/payments");
const reviewRoutes = require("./routes/reviews");
const notifRoutes = require("./routes/notifications");
const bookingRoutes = require("./routes/bookings");
const settingsRoutes = require("./routes/settings");
const analyticsRoutes = require("./routes/analytics");
const adminRoutes = require("./routes/admins");
const auditlogRoutes = require("./routes/auditlog");

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:5500",
      "http://127.0.0.1:5501",
    ],
    credentials: true,
  }),
);
app.use(express.json());

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "pedy-admin-api",
    time: new Date().toISOString(),
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/admin/auth", authRoutes);
app.use("/api/admin/users", userRoutes);
app.use("/api/admin/services", serviceRoutes);
app.use("/api/admin/payments", paymentRoutes);
app.use("/api/admin/reviews", reviewRoutes);
app.use("/api/admin/notifications", notifRoutes);
app.use("/api/admin/bookings", bookingRoutes);
app.use("/api/admin/settings", settingsRoutes);
app.use("/api/admin/analytics", analyticsRoutes);
app.use("/api/admin/admins", adminRoutes);
app.use("/api/admin/auditlog", auditlogRoutes);

// ─── 404 fallback ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal Server Error" });
});

const server = app.listen(PORT, () => {
  console.log(`✅  PEDY Admin API running at http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `❌  Port ${PORT} is already in use. Run: kill $(lsof -ti:${PORT})`,
    );
    process.exit(1);
  } else {
    throw err;
  }
});
