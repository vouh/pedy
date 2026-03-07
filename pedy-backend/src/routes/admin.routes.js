const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/admin.controller");
const { authenticate, requireAdmin } = require("../middleware/auth");

// All admin routes require a valid Firebase token AND admin role
router.use(authenticate, requireAdmin);

// ── Users ──────────────────────────────────────────────────────────────
router.get("/users",                   ctrl.listUsers);
router.put("/users/:uid/status",       ctrl.updateUserStatus);
router.put("/users/:uid/role",         ctrl.updateUserRole);

// ── Services ───────────────────────────────────────────────────────────
router.get("/services",                ctrl.listAllServices);
router.put("/services/:id/status",     ctrl.updateServiceStatus);

// ── Bookings ───────────────────────────────────────────────────────────
router.get("/bookings",                ctrl.listAllBookings);

// ── Payments ───────────────────────────────────────────────────────────
router.get("/payments",                ctrl.listAllPayments);

// ── Analytics ──────────────────────────────────────────────────────────
router.get("/analytics",               ctrl.getAnalytics);

module.exports = router;
