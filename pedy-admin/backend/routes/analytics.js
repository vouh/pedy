const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/rbac");

// ─── Mock analytics ────────────────────────────────────────────────────────────
const data = {
  overview: {
    totalUsers: 1248,
    activeServices: 342,
    totalBookings: 891,
    totalRevenue: 48230,
    newUsersToday: 14,
    pendingReviews: 7,
  },
  revenueByMonth: [
    { month: "Aug", revenue: 3200 },
    { month: "Sep", revenue: 4800 },
    { month: "Oct", revenue: 4200 },
    { month: "Nov", revenue: 5100 },
    { month: "Dec", revenue: 6900 },
    { month: "Jan", revenue: 5800 },
  ],
  topCategories: [
    { name: "Design", bookings: 210, revenue: 12400 },
    { name: "Education", bookings: 185, revenue: 9250 },
    { name: "Home", bookings: 162, revenue: 8100 },
    { name: "Tech", bookings: 148, revenue: 11200 },
    { name: "Beauty", bookings: 98, revenue: 3800 },
  ],
  userGrowth: [
    { month: "Aug", users: 800 },
    { month: "Sep", users: 920 },
    { month: "Oct", users: 980 },
    { month: "Nov", users: 1050 },
    { month: "Dec", users: 1190 },
    { month: "Jan", users: 1248 },
  ],
};

// GET /overview
router.get(
  "/overview",
  authenticate,
  authorize("analytics", "read"),
  (req, res) => {
    res.json(data.overview);
  },
);

// GET /revenue
router.get(
  "/revenue",
  authenticate,
  authorize("analytics", "read"),
  (req, res) => {
    res.json(data.revenueByMonth);
  },
);

// GET /categories
router.get(
  "/categories",
  authenticate,
  authorize("analytics", "read"),
  (req, res) => {
    res.json(data.topCategories);
  },
);

// GET /growth
router.get(
  "/growth",
  authenticate,
  authorize("analytics", "read"),
  (req, res) => {
    res.json(data.userGrowth);
  },
);

module.exports = router;
