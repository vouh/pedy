const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/rbac");

// ─── Mock data (replace with Supabase queries) ────────────────────────────────
let TRANSACTIONS = [
  {
    id: "TXN-8821",
    client: "Daniel Mwangi",
    service: "Home Cleaning",
    amount: 45,
    currency: "USD",
    method: "mpesa",
    status: "refunded",
    date: "2026-03-07",
  },
  {
    id: "TXN-8820",
    client: "Brian Kipchoge",
    service: "Web Development",
    amount: 199,
    currency: "USD",
    method: "card",
    status: "completed",
    date: "2026-03-07",
  },
  {
    id: "TXN-8819",
    client: "Amina Hassan",
    service: "Brand Photography",
    amount: 120,
    currency: "USD",
    method: "card",
    status: "disputed",
    date: "2026-03-06",
  },
  {
    id: "TXN-8818",
    client: "Michael Otieno",
    service: "Personal Training",
    amount: 60,
    currency: "USD",
    method: "mpesa",
    status: "completed",
    date: "2026-03-06",
  },
  {
    id: "TXN-8817",
    client: "Jane Wanjiku",
    service: "Cybersecurity Audit",
    amount: 350,
    currency: "USD",
    method: "card",
    status: "flagged",
    date: "2026-03-05",
  },
  {
    id: "TXN-8816",
    client: "Grace Njeri",
    service: "Hair Braiding",
    amount: 1500,
    currency: "KES",
    method: "mpesa",
    status: "completed",
    date: "2026-03-05",
  },
  {
    id: "TXN-8815",
    client: "Fatuma Ali",
    service: "Interior Design",
    amount: 150,
    currency: "USD",
    method: "card",
    status: "pending",
    date: "2026-03-04",
  },
  {
    id: "TXN-8814",
    client: "David Kim",
    service: "Logo Design",
    amount: 80,
    currency: "USD",
    method: "card",
    status: "flagged",
    date: "2026-03-04",
  },
  {
    id: "TXN-8813",
    client: "Daniel Mwangi",
    service: "Brand Photography",
    amount: 120,
    currency: "USD",
    method: "mpesa",
    status: "disputed",
    date: "2026-03-03",
  },
  {
    id: "TXN-8812",
    client: "Brian Kipchoge",
    service: "Personal Training",
    amount: 60,
    currency: "USD",
    method: "mpesa",
    status: "completed",
    date: "2026-03-03",
  },
];

// ─── GET /api/admin/payments ──────────────────────────────────────────────────
router.get("/", authenticate, authorize("payments", "read"), (req, res) => {
  const { method, status, q } = req.query;
  let result = [...TRANSACTIONS];
  if (method) result = result.filter((t) => t.method === method);
  if (status) result = result.filter((t) => t.status === status);
  if (q)
    result = result.filter(
      (t) =>
        t.id.toLowerCase().includes(q.toLowerCase()) ||
        t.client.toLowerCase().includes(q.toLowerCase()) ||
        t.service.toLowerCase().includes(q.toLowerCase()),
    );
  const totalUSD = result
    .filter((t) => t.currency === "USD" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);
  res.json({
    total: result.length,
    revenue_usd: totalUSD,
    transactions: result,
  });
});

// ─── GET /api/admin/payments/:id ─────────────────────────────────────────────
router.get("/:id", authenticate, authorize("payments", "read"), (req, res) => {
  const txn = TRANSACTIONS.find((t) => t.id === req.params.id);
  if (!txn) return res.status(404).json({ error: "Transaction not found" });
  res.json(txn);
});

// ─── PATCH /api/admin/payments/:id/refund ────────────────────────────────────
router.patch(
  "/:id/refund",
  authenticate,
  authorize("payments", "refund"),
  (req, res) => {
    const txn = TRANSACTIONS.find((t) => t.id === req.params.id);
    if (!txn) return res.status(404).json({ error: "Transaction not found" });
    if (txn.status === "refunded")
      return res.status(400).json({ error: "Already refunded" });
    txn.status = "refunded";
    txn.refundNote = req.body.note || null;
    res.json({ message: "Refund issued", transaction: txn });
  },
);

// ─── PATCH /api/admin/payments/:id/resolve ───────────────────────────────────
router.patch(
  "/:id/resolve",
  authenticate,
  authorize("payments", "resolve"),
  (req, res) => {
    const txn = TRANSACTIONS.find((t) => t.id === req.params.id);
    if (!txn) return res.status(404).json({ error: "Transaction not found" });
    txn.status = "completed";
    txn.resolvedNote = req.body.note || null;
    res.json({ message: "Transaction resolved", transaction: txn });
  },
);

// ─── PATCH /api/admin/payments/:id/flag ──────────────────────────────────────
router.patch(
  "/:id/flag",
  authenticate,
  authorize("payments", "flag"),
  (req, res) => {
    const txn = TRANSACTIONS.find((t) => t.id === req.params.id);
    if (!txn) return res.status(404).json({ error: "Transaction not found" });
    txn.status = "flagged";
    txn.flagReason = req.body.reason || null;
    res.json({ message: "Transaction flagged", transaction: txn });
  },
);

// ─── PATCH /api/admin/payments/:id/clear-flag ────────────────────────────────
router.patch(
  "/:id/clear-flag",
  authenticate,
  authorize("payments", "flag"),
  (req, res) => {
    const txn = TRANSACTIONS.find((t) => t.id === req.params.id);
    if (!txn) return res.status(404).json({ error: "Transaction not found" });
    txn.status = "completed";
    txn.flagReason = null;
    res.json({ message: "Flag cleared", transaction: txn });
  },
);

// ─── GET /api/admin/payments/export/csv ──────────────────────────────────────
router.get(
  "/export/csv",
  authenticate,
  authorize("payments", "export"),
  (req, res) => {
    const headers = [
      "ID",
      "Client",
      "Service",
      "Amount",
      "Currency",
      "Method",
      "Status",
      "Date",
    ];
    const rows = TRANSACTIONS.map((t) =>
      [
        t.id,
        t.client,
        t.service,
        t.amount,
        t.currency,
        t.method,
        t.status,
        t.date,
      ].join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=pedy_payments.csv",
    );
    res.send(csv);
  },
);

module.exports = router;
