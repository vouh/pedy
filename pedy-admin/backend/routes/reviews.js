const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/rbac");

// ─── Mock data ─────────────────────────────────────────────────────────────────
let reviews = [
  {
    id: "rv1",
    serviceId: "s1",
    serviceName: "Logo Design",
    userId: "u1",
    userName: "Alice M.",
    rating: 5,
    comment: "Excellent quality work!",
    status: "approved",
    createdAt: "2025-01-10",
  },
  {
    id: "rv2",
    serviceId: "s2",
    serviceName: "Math Tutoring",
    userId: "u2",
    userName: "Bob K.",
    rating: 2,
    comment: "Did not show up on time.",
    status: "pending",
    createdAt: "2025-01-12",
  },
  {
    id: "rv3",
    serviceId: "s3",
    serviceName: "Home Cleaning",
    userId: "u3",
    userName: "Carol N.",
    rating: 4,
    comment: "Good job overall.",
    status: "approved",
    createdAt: "2025-01-14",
  },
  {
    id: "rv4",
    serviceId: "s4",
    serviceName: "Plumbing Fix",
    userId: "u4",
    userName: "David O.",
    rating: 1,
    comment: "Terrible experience!!!",
    status: "flagged",
    createdAt: "2025-01-15",
  },
  {
    id: "rv5",
    serviceId: "s5",
    serviceName: "Web Dev",
    userId: "u5",
    userName: "Eve P.",
    rating: 5,
    comment: "Highly recommend!",
    status: "approved",
    createdAt: "2025-01-16",
  },
];

// GET /  – list reviews (with optional status/rating filter)
router.get("/", authenticate, authorize("reviews", "read"), (req, res) => {
  let data = [...reviews];
  if (req.query.status)
    data = data.filter((r) => r.status === req.query.status);
  if (req.query.rating)
    data = data.filter((r) => r.rating === Number(req.query.rating));
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 20);
  const total = data.length;
  data = data.slice((page - 1) * limit, page * limit);
  res.json({
    reviews: data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

// GET /:id
router.get("/:id", authenticate, authorize("reviews", "read"), (req, res) => {
  const rv = reviews.find((r) => r.id === req.params.id);
  if (!rv) return res.status(404).json({ error: "Review not found" });
  res.json(rv);
});

// PATCH /:id/approve
router.patch(
  "/:id/approve",
  authenticate,
  authorize("reviews", "write"),
  (req, res) => {
    const rv = reviews.find((r) => r.id === req.params.id);
    if (!rv) return res.status(404).json({ error: "Review not found" });
    rv.status = "approved";
    res.json({ message: "Review approved", review: rv });
  },
);

// PATCH /:id/flag
router.patch(
  "/:id/flag",
  authenticate,
  authorize("reviews", "write"),
  (req, res) => {
    const rv = reviews.find((r) => r.id === req.params.id);
    if (!rv) return res.status(404).json({ error: "Review not found" });
    rv.status = "flagged";
    res.json({ message: "Review flagged", review: rv });
  },
);

// DELETE /:id/remove
router.delete(
  "/:id",
  authenticate,
  authorize("reviews", "remove"),
  (req, res) => {
    const idx = reviews.findIndex((r) => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Review not found" });
    reviews.splice(idx, 1);
    res.json({ message: "Review removed" });
  },
);

module.exports = router;
