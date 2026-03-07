/**
 * PEDY Backend – Express Application Entry Point
 * ------------------------------------------------
 * Starts the REST API server with the following route groups:
 *
 *   POST   /api/auth/register
 *   POST   /api/auth/login
 *   GET    /api/auth/me
 *   GET    /api/services
 *   POST   /api/services
 *   GET    /api/services/:id
 *   PUT    /api/services/:id
 *   DELETE /api/services/:id
 *   GET    /api/providers
 *   GET    /api/providers/:id
 *   PUT    /api/providers/:id
 *   POST   /api/bookings
 *   GET    /api/bookings
 *   GET    /api/bookings/:id
 *   PUT    /api/bookings/:id/status
 *   POST   /api/payments/stk-push
 *   POST   /api/payments/callback
 *   GET    /api/payments/status/:checkoutId
 *
 *   Admin routes (require Firebase token + role=admin in Firestore):
 *   POST   /api/admin/auth/verify                – verify token, return admin profile (public)
 *   GET    /api/admin/analytics
 *   GET    /api/admin/activity
 *   GET    /api/admin/users
 *   PUT    /api/admin/users/:uid/status
 *   PUT    /api/admin/users/:uid/role
 *   PATCH  /api/admin/users/:uid/approve
 *   PATCH  /api/admin/users/:uid/suspend
 *   PATCH  /api/admin/users/:uid/reinstate
 *   DELETE /api/admin/users/:uid
 *   GET    /api/admin/services
 *   PUT    /api/admin/services/:id/status
 *   PATCH  /api/admin/services/:id/approve
 *   PATCH  /api/admin/services/:id/reject
 *   DELETE /api/admin/services/:id
 *   GET    /api/admin/bookings
 *   GET    /api/admin/payments/export/csv
 *   GET    /api/admin/payments
 *   PATCH  /api/admin/payments/:id/refund
 *   PATCH  /api/admin/payments/:id/resolve
 *   PATCH  /api/admin/payments/:id/flag
 *   PATCH  /api/admin/payments/:id/clear-flag
 */

require("dotenv").config();

const express     = require("express");
const cors        = require("cors");
const helmet      = require("helmet");
const morgan      = require("morgan");
const rateLimit   = require("express-rate-limit");

// Route modules
const authRoutes     = require("./routes/auth.routes");
const servicesRoutes = require("./routes/services.routes");
const providersRoutes= require("./routes/providers.routes");
const bookingsRoutes = require("./routes/bookings.routes");
const paymentsRoutes = require("./routes/payments.routes");
const adminRoutes    = require("./routes/admin.routes");

const app  = express();
const PORT = process.env.PORT || 5000;

/* ── Security headers ─────────────────────────────────────────────── */
app.use(helmet());

/* ── CORS ─────────────────────────────────────────────────────────── */
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

/* ── Rate limiting ────────────────────────────────────────────────── */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      200,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: "Too many requests – please try again later" },
});
app.use(limiter);

// Tighter limit on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message:  { error: "Too many auth attempts – please try again in 15 minutes" },
});

/* ── Request parsing ──────────────────────────────────────────────── */
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

/* ── Logging ──────────────────────────────────────────────────────── */
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

/* ── Health check ─────────────────────────────────────────────────── */
app.get("/health", (req, res) =>
  res.status(200).json({ status: "ok", service: "pedy-backend", timestamp: new Date().toISOString() })
);

/* ── API Routes ───────────────────────────────────────────────────── */
app.use("/api/auth",     authLimiter, authRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/providers",providersRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/admin",    adminRoutes);

/* ── 404 handler ──────────────────────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

/* ── Global error handler ─────────────────────────────────────────── */
app.use((err, req, res, _next) => {
  console.error("[GlobalError]", err);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === "production"
    ? "An unexpected error occurred"
    : err.message;
  res.status(status).json({ error: message });
});

/* ── Start server ─────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n🚀  PEDY Backend running on http://localhost:${PORT}`);
  console.log(`    Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`    Health:      http://localhost:${PORT}/health\n`);
});

module.exports = app; // for testing
