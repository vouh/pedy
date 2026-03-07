/**
 * GET /api/admin/analytics
 * Aggregates live counts from Firestore for the admin dashboard.
 *
 * Returned shape:
 * {
 *   users:       { total, providers, clients, pending, suspended },
 *   services:    { total, approved, pending, rejected },
 *   bookings:    { total, pending, confirmed, completed, cancelled },
 *   payments:    { total, revenue_usd, revenue_kes, disputed, flagged, refunded }
 * }
 */

const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/rbac");
const { db } = require("../config/firebase");

router.get(
  "/",
  authenticate,
  authorize("users", "read"),   // dashboard is accessible to all admin roles
  async (req, res) => {
    try {
      const [usersSnap, servicesSnap, bookingsSnap, paymentsSnap] =
        await Promise.all([
          db.collection("users").get(),
          db.collection("services").get(),
          db.collection("bookings").get(),
          db.collection("payments").get(),
        ]);

      // ── Users ────────────────────────────────────────────────────────────
      let totalUsers = 0, providers = 0, clients = 0, pendingUsers = 0, suspended = 0;
      usersSnap.forEach((doc) => {
        const u = doc.data();
        totalUsers++;
        if (u.role === "provider") providers++;
        else clients++;
        if (u.status === "pending")   pendingUsers++;
        if (u.status === "suspended") suspended++;
      });

      // ── Services ─────────────────────────────────────────────────────────
      let totalServices = 0, approvedSvc = 0, pendingSvc = 0, rejectedSvc = 0;
      servicesSnap.forEach((doc) => {
        const s = doc.data();
        totalServices++;
        const st = s.status || "pending";
        if (st === "approved") approvedSvc++;
        else if (st === "rejected") rejectedSvc++;
        else pendingSvc++;
      });

      // ── Bookings ─────────────────────────────────────────────────────────
      let totalBookings = 0, pendingB = 0, confirmedB = 0, completedB = 0, cancelledB = 0;
      bookingsSnap.forEach((doc) => {
        const b = doc.data();
        totalBookings++;
        const st = b.status || "pending";
        if (st === "pending")   pendingB++;
        else if (st === "confirmed") confirmedB++;
        else if (st === "completed") completedB++;
        else if (st === "cancelled") cancelledB++;
      });

      // ── Payments ─────────────────────────────────────────────────────────
      let totalPayments = 0, revenueUSD = 0, revenueKES = 0;
      let disputed = 0, flagged = 0, refunded = 0;
      paymentsSnap.forEach((doc) => {
        const p = doc.data();
        totalPayments++;
        if (p.status === "completed") {
          if (p.currency === "USD") revenueUSD += p.amount || 0;
          if (p.currency === "KES") revenueKES += p.amount || 0;
        }
        if (p.status === "disputed") disputed++;
        if (p.status === "flagged")  flagged++;
        if (p.status === "refunded") refunded++;
      });

      res.json({
        users:    { total: totalUsers, providers, clients, pending: pendingUsers, suspended },
        services: { total: totalServices, approved: approvedSvc, pending: pendingSvc, rejected: rejectedSvc },
        bookings: { total: totalBookings, pending: pendingB, confirmed: confirmedB, completed: completedB, cancelled: cancelledB },
        payments: { total: totalPayments, revenue_usd: revenueUSD, revenue_kes: revenueKES, disputed, flagged, refunded },
      });
    } catch (err) {
      console.error("[analytics]", err);
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
