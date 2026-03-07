const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/rbac");

// ─── Mock settings store ───────────────────────────────────────────────────────
let settings = {
  siteName: "PEDY",
  supportEmail: "support@pedy.com",
  maintenanceMode: false,
  allowRegistration: true,
  maxServicesPerUser: 20,
  commissionRate: 10,
  currency: "USD",
  timezone: "UTC",
};

// GET /
router.get("/", authenticate, authorize("settings", "read"), (req, res) => {
  res.json(settings);
});

// PATCH /  – update any subset
router.patch("/", authenticate, authorize("settings", "write"), (req, res) => {
  const allowed = Object.keys(settings);
  for (const key of Object.keys(req.body)) {
    if (!allowed.includes(key))
      return res.status(400).json({ error: `Unknown setting: ${key}` });
    settings[key] = req.body[key];
  }
  res.json({ message: "Settings updated", settings });
});

module.exports = router;
