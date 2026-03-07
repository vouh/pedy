const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/rbac");

// ─── Mock data ─────────────────────────────────────────────────────────────────
let bookings = [
  {
    id: "bk1",
    serviceId: "s1",
    serviceName: "Logo Design",
    clientId: "u2",
    clientName: "Bob K.",
    providerId: "u1",
    providerName: "Alice M.",
    amount: 150,
    status: "completed",
    scheduledAt: "2025-01-08",
    createdAt: "2025-01-05",
  },
  {
    id: "bk2",
    serviceId: "s3",
    serviceName: "Home Cleaning",
    clientId: "u5",
    clientName: "Eve P.",
    providerId: "u3",
    providerName: "Carol N.",
    amount: 80,
    status: "pending",
    scheduledAt: "2025-01-20",
    createdAt: "2025-01-14",
  },
  {
    id: "bk3",
    serviceId: "s2",
    serviceName: "Math Tutoring",
    clientId: "u6",
    clientName: "Frank Q.",
    providerId: "u2",
    providerName: "Bob K.",
    amount: 50,
    status: "confirmed",
    scheduledAt: "2025-01-18",
    createdAt: "2025-01-15",
  },
  {
    id: "bk4",
    serviceId: "s4",
    serviceName: "Plumbing Fix",
    clientId: "u7",
    clientName: "Grace R.",
    providerId: "u4",
    providerName: "David O.",
    amount: 120,
    status: "cancelled",
    scheduledAt: "2025-01-16",
    createdAt: "2025-01-12",
  },
  {
    id: "bk5",
    serviceId: "s5",
    serviceName: "Web Dev",
    clientId: "u1",
    clientName: "Alice M.",
    providerId: "u5",
    providerName: "Eve P.",
    amount: 400,
    status: "in_progress",
    scheduledAt: "2025-01-19",
    createdAt: "2025-01-16",
  },
];

// GET /
router.get("/", authenticate, authorize("bookings", "read"), (req, res) => {
  let data = [...bookings];
  if (req.query.status)
    data = data.filter((b) => b.status === req.query.status);
  if (req.query.q) {
    const q = req.query.q.toLowerCase();
    data = data.filter(
      (b) =>
        b.serviceName.toLowerCase().includes(q) ||
        b.clientName.toLowerCase().includes(q) ||
        b.providerName.toLowerCase().includes(q),
    );
  }
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 20);
  const total = data.length;
  data = data.slice((page - 1) * limit, page * limit);
  res.json({
    bookings: data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

// GET /:id
router.get("/:id", authenticate, authorize("bookings", "read"), (req, res) => {
  const bk = bookings.find((b) => b.id === req.params.id);
  if (!bk) return res.status(404).json({ error: "Booking not found" });
  res.json(bk);
});

// PATCH /:id/cancel
router.patch(
  "/:id/cancel",
  authenticate,
  authorize("bookings", "write"),
  (req, res) => {
    const bk = bookings.find((b) => b.id === req.params.id);
    if (!bk) return res.status(404).json({ error: "Booking not found" });
    bk.status = "cancelled";
    res.json({ message: "Booking cancelled", booking: bk });
  },
);

module.exports = router;
