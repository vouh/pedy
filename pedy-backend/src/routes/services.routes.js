const express  = require("express");
const router   = express.Router();
const ctrl     = require("../controllers/services.controller");
const { authenticate, requireProvider } = require("../middleware/auth");

// GET  /api/services        – public
router.get("/", ctrl.getServices);

// GET  /api/services/:id    – public
router.get("/:id", ctrl.getService);

// POST /api/services        – provider only
router.post("/", authenticate, requireProvider, ctrl.createService);

// PUT  /api/services/:id    – provider only (ownership enforced in controller)
router.put("/:id", authenticate, requireProvider, ctrl.updateService);

// DELETE /api/services/:id  – provider only (ownership enforced in controller)
router.delete("/:id", authenticate, requireProvider, ctrl.deleteService);

module.exports = router;
