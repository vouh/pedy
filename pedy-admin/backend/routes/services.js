const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/rbac");

// ─── Mock data (replace with Supabase queries) ────────────────────────────────
let SERVICES = [
  {
    id: 1,
    title: "Modern Web Development",
    provider: "Alex Rivera",
    type: "digital",
    price: 199,
    currency: "USD",
    status: "approved",
  },
  {
    id: 2,
    title: "Professional Home Cleaning",
    provider: "Sarah Jenkins",
    type: "physical",
    price: 45,
    currency: "USD",
    status: "approved",
  },
  {
    id: 3,
    title: "Brand Photography",
    provider: "Marcus Thorne",
    type: "physical",
    price: 120,
    currency: "USD",
    status: "pending",
  },
  {
    id: 4,
    title: "Cybersecurity Audit",
    provider: "David Kim",
    type: "digital",
    price: 350,
    currency: "USD",
    status: "approved",
  },
  {
    id: 5,
    title: "Fake Logo Design",
    provider: "spammer_01",
    type: "digital",
    price: 5,
    currency: "USD",
    status: "pending",
  },
  {
    id: 6,
    title: "Personal Training",
    provider: "Chris Evans",
    type: "physical",
    price: 60,
    currency: "USD",
    status: "approved",
  },
  {
    id: 7,
    title: "Virtual Interior Design",
    provider: "Eliza Grant",
    type: "digital",
    price: 150,
    currency: "USD",
    status: "pending",
  },
  {
    id: 8,
    title: "Hair Braiding",
    provider: "Grace Njeri",
    type: "physical",
    price: 1500,
    currency: "KES",
    status: "pending",
  },
];

// ─── GET /api/admin/services ──────────────────────────────────────────────────
router.get("/", authenticate, authorize("services", "read"), (req, res) => {
  const { type, status, q } = req.query;
  let result = [...SERVICES];
  if (type) result = result.filter((s) => s.type === type);
  if (status) result = result.filter((s) => s.status === status);
  if (q)
    result = result.filter(
      (s) =>
        s.title.toLowerCase().includes(q.toLowerCase()) ||
        s.provider.toLowerCase().includes(q.toLowerCase()),
    );
  res.json({ total: result.length, services: result });
});

// ─── GET /api/admin/services/:id ─────────────────────────────────────────────
router.get("/:id", authenticate, authorize("services", "read"), (req, res) => {
  const service = SERVICES.find((s) => s.id === parseInt(req.params.id));
  if (!service) return res.status(404).json({ error: "Service not found" });
  res.json(service);
});

// ─── PATCH /api/admin/services/:id/approve ───────────────────────────────────
router.patch(
  "/:id/approve",
  authenticate,
  authorize("services", "approve"),
  (req, res) => {
    const service = SERVICES.find((s) => s.id === parseInt(req.params.id));
    if (!service) return res.status(404).json({ error: "Service not found" });
    service.status = "approved";
    res.json({ message: "Service approved", service });
  },
);

// ─── PATCH /api/admin/services/:id/reject ────────────────────────────────────
router.patch(
  "/:id/reject",
  authenticate,
  authorize("services", "reject"),
  (req, res) => {
    const service = SERVICES.find((s) => s.id === parseInt(req.params.id));
    if (!service) return res.status(404).json({ error: "Service not found" });
    const { reason } = req.body;
    service.status = "rejected";
    if (reason) service.rejectReason = reason;
    res.json({ message: "Service rejected", service });
  },
);

// ─── DELETE /api/admin/services/:id ──────────────────────────────────────────
router.delete(
  "/:id",
  authenticate,
  authorize("services", "remove"),
  (req, res) => {
    const idx = SERVICES.findIndex((s) => s.id === parseInt(req.params.id));
    if (idx === -1) return res.status(404).json({ error: "Service not found" });
    const [removed] = SERVICES.splice(idx, 1);
    res.json({ message: "Service removed", service: removed });
  },
);

module.exports = router;
