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

// Helper: normalize a Firestore user doc
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

// GET /api/admin/users
router.get("/", authenticate, authorize("users", "read"), async (req, res) => {
  try {
    const { role, status, q } = req.query;
    const snap = await db.collection("users").orderBy("createdAt", "desc").get();
    let users = snap.docs.map((d) => normalize(d.id, d.data()));
    if (role)   users = users.filter((u) => u.role === role);
    if (status) users = users.filter((u) => u.status === status);
    if (q) {
      const term = q.toLowerCase();
      users = users.filter((u) =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term));
    }
    res.json({ total: users.length, users });
  } catch (err) {
    console.error("[users GET /]", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users/:id
router.get("/:id", authenticate, authorize("users", "read"), async (req, res) => {
  try {
    const snap = await db.collection("users").doc(req.params.id).get();
    if (!snap.exists) return res.status(404).json({ error: "User not found" });
    res.json(normalize(snap.id, snap.data()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/users/:id/approve
router.patch("/:id/approve", authenticate, authorize("users", "write"), async (req, res) => {
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
});

// PATCH /api/admin/users/:id/suspend
router.patch("/:id/suspend", authenticate, authorize("users", "suspend"), async (req, res) => {
  try {
    const ref  = db.collection("users").doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "User not found" });
    await ref.update({ status: "suspended" });
    res.json({ message: "User suspended", user: normalize(snap.id, { ...snap.data(), status: "suspended" }) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/users/:id/reinstate
router.patch("/:id/reinstate", authenticate, authorize("users", "suspend"), async (req, res) => {
  try {
    const ref  = db.collection("users").doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "User not found" });
    await ref.update({ status: "active" });
    res.json({ message: "User reinstated", user: normalize(snap.id, { ...snap.data(), status: "active" }) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/users/:id  (ban – super_admin only)
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
