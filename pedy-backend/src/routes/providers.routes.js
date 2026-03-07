const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/providers.controller");
const { authenticate } = require("../middleware/auth");

// GET  /api/providers           – public
router.get("/", ctrl.getProviders);

// GET  /api/providers/:id       – public
router.get("/:id", ctrl.getProvider);

// PUT  /api/providers/:id       – authenticated (own profile only)
router.put("/:id", authenticate, ctrl.updateProfile);

module.exports = router;
