const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/rbac");

// ─── In-memory audit log ───────────────────────────────────────────────────────
// In production, push to this array from every mutating route.
const logs = [
  {
    id: "l1",
    adminId: "a1",
    adminName: "Super Admin",
    action: "user.suspend",
    target: "u3 – Carol N.",
    ip: "192.168.1.10",
    createdAt: "2025-01-15T09:12:00Z",
  },
  {
    id: "l2",
    adminId: "a2",
    adminName: "Moderator",
    action: "service.approve",
    target: "s1 – Logo Design",
    ip: "192.168.1.11",
    createdAt: "2025-01-15T10:30:00Z",
  },
  {
    id: "l3",
    adminId: "a3",
    adminName: "Pay Manager",
    action: "payment.refund",
    target: "tx-001 $25.00",
    ip: "10.0.0.5",
    createdAt: "2025-01-15T11:00:00Z",
  },
  {
    id: "l4",
    adminId: "a1",
    adminName: "Super Admin",
    action: "review.remove",
    target: "rv4 – David O.",
    ip: "192.168.1.10",
    createdAt: "2025-01-15T13:45:00Z",
  },
  {
    id: "l5",
    adminId: "a2",
    adminName: "Moderator",
    action: "service.reject",
    target: "s6 – Spam Ad",
    ip: "192.168.1.11",
    createdAt: "2025-01-16T08:22:00Z",
  },
  {
    id: "l6",
    adminId: "a1",
    adminName: "Super Admin",
    action: "admin.create",
    target: "a4 – New Admin",
    ip: "192.168.1.10",
    createdAt: "2025-01-16T09:00:00Z",
  },
];

/**
 * Push a log entry from any other route:
 *   const { appendLog } = require("./auditlog");
 *   appendLog(req.admin, "user.ban", "u5 – Alice");
 */
function appendLog(admin, action, target) {
  logs.unshift({
    id: "l" + Date.now(),
    adminId: admin.id,
    adminName: admin.name,
    action,
    target,
    ip: "–",
    createdAt: new Date().toISOString(),
  });
}

// GET /
router.get("/", authenticate, authorize("auditlog", "read"), (req, res) => {
  let data = [...logs];
  if (req.query.adminId)
    data = data.filter((l) => l.adminId === req.query.adminId);
  if (req.query.action)
    data = data.filter((l) => l.action.includes(req.query.action));
  if (req.query.q) {
    const q = req.query.q.toLowerCase();
    data = data.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.adminName.toLowerCase().includes(q) ||
        l.target.toLowerCase().includes(q),
    );
  }
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 25);
  const total = data.length;
  data = data.slice((page - 1) * limit, page * limit);
  res.json({ logs: data, total, page, totalPages: Math.ceil(total / limit) });
});

module.exports = router;
module.exports.appendLog = appendLog;
