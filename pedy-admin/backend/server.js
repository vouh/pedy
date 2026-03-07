require("dotenv").config();
const express   = require("express");
const cors      = require("cors");
const helmet    = require("helmet");
const morgan    = require("morgan");
const rateLimit = require("express-rate-limit");

const authRoutes      = require("./routes/auth");
const userRoutes      = require("./routes/users");
const serviceRoutes   = require("./routes/services");
const paymentRoutes   = require("./routes/payments");
const analyticsRoutes = require("./routes/analytics");

const app  = express();
const PORT = process.env.PORT || 4000;

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  "http://127.0.0.1:5500,http://127.0.0.1:5501,http://localhost:3000"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    },
    credentials: true,
  }),
);

// ─── Rate limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests – please try again later" },
});
app.use(limiter);

// ─── Request parsing + Logging ────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "pedy-admin-api",
    time: new Date().toISOString(),
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/admin/auth",      authRoutes);
app.use("/api/admin/users",     userRoutes);
app.use("/api/admin/services",  serviceRoutes);
app.use("/api/admin/payments",  paymentRoutes);
app.use("/api/admin/analytics", analyticsRoutes);

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
