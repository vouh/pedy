const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/admin.controller");
const { authenticate, requireAdmin } = require("../middleware/auth");

// ── Auth (no token required yet) ──────────────────────────────────────
router.post("/auth/verify",            ctrl.verifyAdmin);

// All routes below require a valid Firebase token AND admin role
router.use(authenticate, requireAdmin);

// ── Analytics ──────────────────────────────────────────────────────────
router.get("/analytics",               ctrl.getAnalytics);
// ── Activity Log ───────────────────────────────────────────────────────────
router.get("/activity",                ctrl.getActivityLog);
// ── Users ──────────────────────────────────────────────────────────────
router.get("/users",                   ctrl.listUsers);
router.put("/users/:uid/status",       ctrl.updateUserStatus);
router.put("/users/:uid/role",         ctrl.updateUserRole);
router.patch("/users/:uid/approve",    ctrl.approveUser);
router.patch("/users/:uid/suspend",    ctrl.suspendUser);
router.patch("/users/:uid/reinstate",  ctrl.reinstateUser);
router.delete("/users/:uid",           ctrl.deleteUser);

// ── Services ───────────────────────────────────────────────────────────
router.get("/services",                ctrl.listAllServices);
router.put("/services/:id/status",     ctrl.updateServiceStatus);
router.patch("/services/:id/approve",  ctrl.approveService);
router.patch("/services/:id/reject",   ctrl.rejectService);
router.delete("/services/:id",         ctrl.deleteService);

// ── Bookings ───────────────────────────────────────────────────────────
router.get("/bookings",                ctrl.listAllBookings);

// ── Payments (specific routes before /:id) ─────────────────────────────
router.get("/payments/export/csv",     ctrl.exportPaymentsCsv);
router.get("/payments",                ctrl.listAllPayments);
router.patch("/payments/:id/refund",   ctrl.refundPayment);
router.patch("/payments/:id/resolve",  ctrl.resolvePayment);
router.patch("/payments/:id/flag",     ctrl.flagPayment);
router.patch("/payments/:id/clear-flag", ctrl.clearFlagPayment);

module.exports = router;
