/**
 * Admin Payments Routes
 *
 * Payment documents live in Firestore: payments/{id}
 * Documents are written by pedy-backend's M-Pesa callback handler.
 * Document shape:
 *   { clientId, serviceId, providerName, clientName, serviceName,
 *     amount, currency, method, status, checkoutId, createdAt, ... }
 *
 * Note: the /export/csv route MUST be defined BEFORE /:id to avoid
 * the Express router treating "export" as a dynamic :id value.
 */

const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/rbac");
const { db } = require("../config/firebase");

function normalize(id, data) {
  const createdAt = data.createdAt
    ? new Date(data.createdAt._seconds * 1000).toISOString().split("T")[0]
    : "Unknown";
  return {
    id,
    client:   data.clientName  || data.clientId  || "Unknown",
    service:  data.serviceName || data.serviceId || "Unknown",
    amount:   data.amount   || 0,
    currency: data.currency || "USD",
    method:   data.method   || "unknown",
    status:   data.status   || "pending",
    date:     createdAt,
  };
}

// GET /api/admin/payments/export/csv  (MUST come before /:id)
router.get("/export/csv", authenticate, authorize("payments", "export"), async (req, res) => {
  try {
    const snap = await db.collection("payments").orderBy("createdAt", "desc").get();
    const rows = snap.docs.map((d) => {
      const p = normalize(d.id, d.data());
      return [p.id, p.client, p.service, p.amount, p.currency, p.method, p.status, p.date].join(",");
    });
    const csv = ["ID,Client,Service,Amount,Currency,Method,Status,Date", ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=pedy_payments.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/payments
router.get("/", authenticate, authorize("payments", "read"), async (req, res) => {
  try {
    const { method, status, q } = req.query;
    const snap = await db.collection("payments").orderBy("createdAt", "desc").get();
    let result = snap.docs.map((d) => normalize(d.id, d.data()));
    if (method) result = result.filter((t) => t.method === method);
    if (status) result = result.filter((t) => t.status === status);
    if (q) {
      const term = q.toLowerCase();
      result = result.filter((t) =>
        t.id.toLowerCase().includes(term)      ||
        t.client.toLowerCase().includes(term)  ||
        t.service.toLowerCase().includes(term));
    }
    const revenueUSD = result
      .filter((t) => t.currency === "USD" && t.status === "completed")
      .reduce((sum, t) => sum + t.amount, 0);
    res.json({ total: result.length, revenue_usd: revenueUSD, transactions: result });
  } catch (err) {
    console.error("[payments GET /]", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/payments/:id
router.get("/:id", authenticate, authorize("payments", "read"), async (req, res) => {
  try {
    const snap = await db.collection("payments").doc(req.params.id).get();
    if (!snap.exists) return res.status(404).json({ error: "Transaction not found" });
    res.json(normalize(snap.id, snap.data()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/payments/:id/refund
router.patch("/:id/refund", authenticate, authorize("payments", "refund"), async (req, res) => {
  try {
    const ref  = db.collection("payments").doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Transaction not found" });
    if (snap.data().status === "refunded")
      return res.status(400).json({ error: "Already refunded" });
    await ref.update({ status: "refunded", refundNote: req.body.note || null });
    res.json({ message: "Refund issued", transaction: normalize(snap.id, { ...snap.data(), status: "refunded" }) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/payments/:id/resolve
router.patch("/:id/resolve", authenticate, authorize("payments", "resolve"), async (req, res) => {
  try {
    const ref  = db.collection("payments").doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Transaction not found" });
    await ref.update({ status: "completed", resolvedNote: req.body.note || null });
    res.json({ message: "Transaction resolved", transaction: normalize(snap.id, { ...snap.data(), status: "completed" }) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/payments/:id/flag
router.patch("/:id/flag", authenticate, authorize("payments", "flag"), async (req, res) => {
  try {
    const ref  = db.collection("payments").doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Transaction not found" });
    await ref.update({ status: "flagged", flagReason: req.body.reason || null });
    res.json({ message: "Transaction flagged", transaction: normalize(snap.id, { ...snap.data(), status: "flagged" }) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/payments/:id/clear-flag
router.patch("/:id/clear-flag", authenticate, authorize("payments", "flag"), async (req, res) => {
  try {
    const ref  = db.collection("payments").doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Transaction not found" });
    await ref.update({ status: "completed", flagReason: null });
    res.json({ message: "Flag cleared", transaction: normalize(snap.id, { ...snap.data(), status: "completed" }) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
