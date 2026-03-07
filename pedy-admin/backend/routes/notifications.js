const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/rbac");

// ─── Mock data ─────────────────────────────────────────────────────────────────
let notifications = [
  {
    id: "n1",
    type: "info",
    title: "New user signup",
    body: "Alice M. joined PEDY.",
    sentTo: "all",
    status: "sent",
    createdAt: "2025-01-10",
  },
  {
    id: "n2",
    type: "warning",
    title: "Payment dispute opened",
    body: "Dispute #D-501 has been opened.",
    sentTo: "payment_manager",
    status: "sent",
    createdAt: "2025-01-12",
  },
  {
    id: "n3",
    type: "info",
    title: "Scheduled maintenance",
    body: "Maintenance window Jan 20 02:00.",
    sentTo: "all",
    status: "draft",
    createdAt: "2025-01-14",
  },
  {
    id: "n4",
    type: "success",
    title: "Service approved",
    body: "Logo Design service is live.",
    sentTo: "providers",
    status: "sent",
    createdAt: "2025-01-15",
  },
];

// GET /
router.get(
  "/",
  authenticate,
  authorize("notifications", "read"),
  (req, res) => {
    let data = [...notifications];
    if (req.query.status)
      data = data.filter((n) => n.status === req.query.status);
    if (req.query.type) data = data.filter((n) => n.type === req.query.type);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const total = data.length;
    data = data.slice((page - 1) * limit, page * limit);
    res.json({
      notifications: data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  },
);

// POST /send  – create & send
router.post(
  "/send",
  authenticate,
  authorize("notifications", "write"),
  (req, res) => {
    const { type = "info", title, body, sentTo = "all" } = req.body;
    if (!title || !body)
      return res.status(400).json({ error: "title and body are required" });
    const notif = {
      id: "n" + Date.now(),
      type,
      title,
      body,
      sentTo,
      status: "sent",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    notifications.unshift(notif);
    res.status(201).json({ message: "Notification sent", notification: notif });
  },
);

// DELETE /:id
router.delete(
  "/:id",
  authenticate,
  authorize("notifications", "write"),
  (req, res) => {
    const idx = notifications.findIndex((n) => n.id === req.params.id);
    if (idx === -1)
      return res.status(404).json({ error: "Notification not found" });
    notifications.splice(idx, 1);
    res.json({ message: "Notification deleted" });
  },
);

module.exports = router;
