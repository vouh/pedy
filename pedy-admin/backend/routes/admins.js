const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { authenticate, authorize } = require("../middleware/rbac");

// Shared store with auth.js (in real app this would be a DB)
let admins = [
  {
    id: "a1",
    name: "Super Admin",
    email: "superadmin@pedy.com",
    role: "super_admin",
    status: "active",
    createdAt: "2024-12-01",
  },
  {
    id: "a2",
    name: "Moderator",
    email: "moderator@pedy.com",
    role: "content_moderator",
    status: "active",
    createdAt: "2024-12-05",
  },
  {
    id: "a3",
    name: "Pay Manager",
    email: "payments@pedy.com",
    role: "payment_manager",
    status: "active",
    createdAt: "2024-12-10",
  },
];

// GET /
router.get("/", authenticate, authorize("admins", "read"), (req, res) => {
  const safe = admins.map(({ password, ...a }) => a);
  res.json({ admins: safe, total: safe.length });
});

// GET /:id
router.get("/:id", authenticate, authorize("admins", "read"), (req, res) => {
  const adm = admins.find((a) => a.id === req.params.id);
  if (!adm) return res.status(404).json({ error: "Admin not found" });
  const { password, ...safe } = adm;
  res.json(safe);
});

// POST /  – create admin
router.post(
  "/",
  authenticate,
  authorize("admins", "write"),
  async (req, res) => {
    const { name, email, role, password } = req.body;
    if (!name || !email || !role || !password)
      return res
        .status(400)
        .json({ error: "name, email, role, password required" });
    const valid = ["super_admin", "content_moderator", "payment_manager"];
    if (!valid.includes(role))
      return res.status(400).json({ error: "Invalid role" });
    if (admins.find((a) => a.email === email))
      return res.status(409).json({ error: "Email already registered" });
    const hash = await bcrypt.hash(password, 10);
    const adm = {
      id: "a" + Date.now(),
      name,
      email,
      role,
      password: hash,
      status: "active",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    admins.push(adm);
    const { password: _, ...safe } = adm;
    res.status(201).json({ message: "Admin created", admin: safe });
  },
);

// PATCH /:id/deactivate
router.patch(
  "/:id/deactivate",
  authenticate,
  authorize("admins", "write"),
  (req, res) => {
    if (req.params.id === req.admin.id)
      return res.status(400).json({ error: "Cannot deactivate yourself" });
    const adm = admins.find((a) => a.id === req.params.id);
    if (!adm) return res.status(404).json({ error: "Admin not found" });
    adm.status = "inactive";
    const { password, ...safe } = adm;
    res.json({ message: "Admin deactivated", admin: safe });
  },
);

// DELETE /:id
router.delete(
  "/:id",
  authenticate,
  authorize("admins", "write"),
  (req, res) => {
    if (req.params.id === req.admin.id)
      return res.status(400).json({ error: "Cannot delete yourself" });
    const idx = admins.findIndex((a) => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Admin not found" });
    admins.splice(idx, 1);
    res.json({ message: "Admin deleted" });
  },
);

module.exports = router;
