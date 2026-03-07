/**
 * Admin Services Routes
 *
 * All service documents live in Firestore: services/{id}
 * Document shape (created by the user-facing front end via db.js):
 *   { title, description, price, category, providerId, providerName,
 *     rating, reviewCount, status?, createdAt }
 *
 * The `status` field defaults to "pending" (new listings need admin approval).
 * The `type` field (digital/physical) is set by admin or inferred from category.
 */

const router = require("express").Router();
const { authenticate, authorize } = require("../middleware/rbac");
const { db } = require("../config/firebase");

// Helper: normalize a Firestore service doc
function normalize(id, data) {
  return {
    id,
    title:    data.title    || "Untitled",
    provider: data.providerName || data.providerId || "Unknown",
    category: data.category || "",
    type:     data.type     || "",
    price:    data.price    || 0,
    currency: data.currency || "USD",
    status:   data.status   || "pending",
  };
}

// GET /api/admin/services
router.get("/", authenticate, authorize("services", "read"), async (req, res) => {
  try {
    const { type, status, q } = req.query;
    const snap = await db.collection("services").orderBy("createdAt", "desc").get();
    let services = snap.docs.map((d) => normalize(d.id, d.data()));
    if (type)   services = services.filter((s) => s.type === type || s.category === type);
    if (status) services = services.filter((s) => s.status === status);
    if (q) {
      const term = q.toLowerCase();
      services = services.filter((s) =>
        s.title.toLowerCase().includes(term) ||
        s.provider.toLowerCase().includes(term) ||
        s.category.toLowerCase().includes(term));
    }
    res.json({ total: services.length, services });
  } catch (err) {
    console.error("[services GET /]", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/services/:id
router.get("/:id", authenticate, authorize("services", "read"), async (req, res) => {
  try {
    const snap = await db.collection("services").doc(req.params.id).get();
    if (!snap.exists) return res.status(404).json({ error: "Service not found" });
    res.json(normalize(snap.id, snap.data()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/services/:id/approve
router.patch("/:id/approve", authenticate, authorize("services", "approve"), async (req, res) => {
  try {
    const ref  = db.collection("services").doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Service not found" });
    await ref.update({ status: "approved" });
    res.json({ message: "Service approved", service: normalize(snap.id, { ...snap.data(), status: "approved" }) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/services/:id/reject
router.patch("/:id/reject", authenticate, authorize("services", "reject"), async (req, res) => {
  try {
    const ref  = db.collection("services").doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Service not found" });
    const { reason } = req.body;
    await ref.update({ status: "rejected", rejectReason: reason || null });
    res.json({ message: "Service rejected", service: normalize(snap.id, { ...snap.data(), status: "rejected" }) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/services/:id
router.delete("/:id", authenticate, authorize("services", "remove"), async (req, res) => {
  try {
    const ref  = db.collection("services").doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Service not found" });
    const serviceData = normalize(snap.id, snap.data());
    await ref.delete();
    res.json({ message: "Service removed", service: serviceData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
