const express = require("express");
const router  = express.Router();
const ctrl    = require("../controllers/bookings.controller");
const { authenticate } = require("../middleware/auth");

// All booking routes require authentication
router.use(authenticate);

// POST /api/bookings
router.post("/", ctrl.createBooking);

// GET  /api/bookings?role=client|provider
router.get("/", ctrl.getBookings);

// GET  /api/bookings/:id
router.get("/:id", ctrl.getBooking);

// PUT  /api/bookings/:id/status
router.put("/:id/status", ctrl.updateBookingStatus);

module.exports = router;
