/**
 * Admin Users Routes
 *
 * All user documents live in Firestore: users/{uid}
 * Document shape (created by the user-facing front end):
 *   { uid, email, displayName, role: "provider"|"client", photoURL, bio,
 *     location, skills, status?, createdAt }
 *
 * The `status` field defaults to "active" for new accounts.
 * Admins can set status to "active" | "pending" | "suspended" via PATCH routes.
 */

const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/rbac");
const { db } = require("../config/firebase");

// ─── Helper: normalize a Firestore user doc ───────────────────────────────────
function normalize(id, data) {
  return {
    id,
    name:     data.displayName || data.email || "Unknown",
    email:    data.email || "",
    role:     data.role     || "client",
    status:   data.status  || "active",
    location: data.location || "",
    joined:   data.createdAt
      ? new Date(data.createdAt._seconds * 1000).toLocaleDateString("en-KE", {
          year: "numeric", month: "short", day: "numeric",
        })
      : "Unknown",
  };
}

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get("/", authenticate, authorize("users", "read"), async (req, res) => {
  try {
    const { role, status, q } = req.query;
    const snap = await db.collection("users").orderBy("createdAt", "desc").get();
    let users = snap.docs.map((d) => normalize(d.id, d.data()));

    if (role)   users = users.filter((u) => u.role === role);
    if (status) users = users.filter((u) => u.status === status);
    if (q) {
      const term = q.toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term),
      );
    }

    res.json({ total: users.length, users });
  } catch (err) {
    console.error("[users GET /]", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/admin/users/:id ─────────────────────────────────────────────────
router.get("/:id", authenticate, authorize("users", "read"), async (req, res) => {
  try {
    const snap = await db.collection("users").doc(req.params.id).get();
    if (!snap.exists) return res.status(404).json({ error: "User not found" });
    res.json(normalize(snap.id, snap.data()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/admin/users/:id/approve ──────────────────────────────────────
router.patch(
  "/:id/approve",
  authenticate,
  authorize("users", "write"),
  async (req, res) => {
    try {
      const ref  = db.collection("users").doc(req.params.id);
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).json({ error: "User not found" });
      if (snap.data().role !== "provider")
        return res.status(400).json({ error: "Only providers can be approved" });
      await ref.update({ status: "active" });
      res.json({ message: "Provider approved", user: normalize(snap.id, { ...snap.data(), status: "active" }) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// ─── PATCH /api/admin/users/:id/suspend ──────────────────────────────────────
router.patch(
  "/:id/suspend",
  authenticate,
  authorize("users", "suspend"),
  async (req, res) => {
    try {
      const ref  = db.collection("users").doc(req.params.id);
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).json({ error: "User not found" });
      await ref.update({ status: "suspended" });
      res.json({ message: "User suspended", user: normalize(snap.id, { ...snap.data(), status: "suspended" }) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// ─── PATCH /api/admin/users/:id/reinstate ─────────────────────────────────────
router.patch(
  "/:id/reinstate",
  authenticate,
  authorize("users", "suspend"),
  async (req, res) => {
    try {
      const ref  = db.collection("users").doc(req.params.id);
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).json({ error: "User not found" });
      await ref.update({ status: "active" });
      res.json({ message: "User reinstated", user: normalize(snap.id, { ...snap.data(), status: "active" }) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// ─── DELETE /api/admin/users/:id  (ban – super_admin only) ───────────────────
router.delete("/:id", authenticate, authorize("users", "ban"), async (req, res) => {
  try {
    const ref  = db.collection("users").doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "User not found" });
    const userData = normalize(snap.id, snap.data());
    await ref.delete();
    res.json({ message: "User permanently banned and deleted", user: userData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

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
