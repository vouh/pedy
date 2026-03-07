const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/payments.controller");
const { authenticate } = require("../middleware/auth");

// POST /api/payments/stk-push   – authenticated client
router.post("/stk-push", authenticate, ctrl.initiateSTKPush);

// POST /api/payments/callback   – public (called by Safaricom)
router.post("/callback", ctrl.mpesaCallback);

// GET  /api/payments/status/:checkoutId – authenticated
router.get("/status/:checkoutId", authenticate, ctrl.queryPaymentStatus);

module.exports = router;
