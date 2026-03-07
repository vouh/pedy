const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/rbac");

// ─── Mock data (replace with Supabase queries) ────────────────────────────────
let USERS = [
  {
    id: 1,
    name: "Jane Wanjiku",
    email: "jane@email.com",
    role: "provider",
    status: "pending",
    location: "Nairobi, KE",
    joined: "2026-03-07",
  },
  {
    id: 2,
    name: "Michael Otieno",
    email: "michael@email.com",
    role: "client",
    status: "active",
    location: "Lagos, NG",
    joined: "2026-03-06",
  },
  {
    id: 3,
    name: "Amina Hassan",
    email: "amina@email.com",
    role: "provider",
    status: "active",
    location: "Mombasa, KE",
    joined: "2026-03-05",
  },
  {
    id: 4,
    name: "Daniel Mwangi",
    email: "daniel@email.com",
    role: "client",
    status: "active",
    location: "Kisumu, KE",
    joined: "2026-03-04",
  },
  {
    id: 5,
    name: "spam_account_44",
    email: "spam@spam.com",
    role: "provider",
    status: "suspended",
    location: "Unknown",
    joined: "2026-03-03",
  },
  {
    id: 6,
    name: "Grace Njeri",
    email: "grace@email.com",
    role: "provider",
    status: "pending",
    location: "Nakuru, KE",
    joined: "2026-03-03",
  },
  {
    id: 7,
    name: "Brian Kipchoge",
    email: "brian@email.com",
    role: "client",
    status: "active",
    location: "Eldoret, KE",
    joined: "2026-03-02",
  },
  {
    id: 8,
    name: "Fatuma Ali",
    email: "fatuma@email.com",
    role: "provider",
    status: "active",
    location: "Zanzibar, TZ",
    joined: "2026-03-01",
  },
];

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get("/", authenticate, authorize("users", "read"), (req, res) => {
  const { role, status, q } = req.query;
  let result = [...USERS];
  if (role) result = result.filter((u) => u.role === role);
  if (status) result = result.filter((u) => u.status === status);
  if (q)
    result = result.filter(
      (u) =>
        u.name.toLowerCase().includes(q.toLowerCase()) ||
        u.email.toLowerCase().includes(q.toLowerCase()),
    );
  res.json({ total: result.length, users: result });
});

// ─── GET /api/admin/users/:id ─────────────────────────────────────────────────
router.get("/:id", authenticate, authorize("users", "read"), (req, res) => {
  const user = USERS.find((u) => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// ─── PATCH /api/admin/users/:id/approve ──────────────────────────────────────
router.patch(
  "/:id/approve",
  authenticate,
  authorize("users", "write"),
  (req, res) => {
    const user = USERS.find((u) => u.id === parseInt(req.params.id));
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role !== "provider")
      return res.status(400).json({ error: "Only providers can be approved" });
    user.status = "active";
    res.json({ message: "Provider approved", user });
  },
);

// ─── PATCH /api/admin/users/:id/suspend ──────────────────────────────────────
router.patch(
  "/:id/suspend",
  authenticate,
  authorize("users", "suspend"),
  (req, res) => {
    const user = USERS.find((u) => u.id === parseInt(req.params.id));
    if (!user) return res.status(404).json({ error: "User not found" });
    user.status = "suspended";
    res.json({ message: "User suspended", user });
  },
);

// ─── PATCH /api/admin/users/:id/reinstate ────────────────────────────────────
router.patch(
  "/:id/reinstate",
  authenticate,
  authorize("users", "suspend"),
  (req, res) => {
    const user = USERS.find((u) => u.id === parseInt(req.params.id));
    if (!user) return res.status(404).json({ error: "User not found" });
    user.status = "active";
    res.json({ message: "User reinstated", user });
  },
);

// ─── DELETE /api/admin/users/:id  (ban – super_admin only) ───────────────────
router.delete("/:id", authenticate, authorize("users", "ban"), (req, res) => {
  const idx = USERS.findIndex((u) => u.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "User not found" });
  const [banned] = USERS.splice(idx, 1);
  res.json({ message: "User permanently banned", user: banned });
});

module.exports = router;
