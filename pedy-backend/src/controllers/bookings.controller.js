/**
 * Bookings Controller
 * Manages service booking requests between clients and providers.
 *
 * Endpoints:
 *   POST /api/bookings               – create a booking (client)
 *   GET  /api/bookings               – list bookings for the current user
 *   GET  /api/bookings/:id           – get a single booking
 *   PUT  /api/bookings/:id/status    – update booking status (provider)
 */

const { db } = require("../config/firebase");
const { v4: uuidv4 } = require("uuid");

const VALID_STATUSES = ["pending", "accepted", "declined", "completed", "cancelled"];

/**
 * POST /api/bookings
 * Body: { serviceId, providerId, message, scheduledDate? }
 */
async function createBooking(req, res) {
  const { serviceId, providerId, message = "", scheduledDate } = req.body;

  if (!serviceId || !providerId) {
    return res.status(400).json({ error: "serviceId and providerId are required" });
  }

  try {
    // Verify the service exists
    const serviceSnap = await db.collection("services").doc(serviceId).get();
    if (!serviceSnap.exists) {
      return res.status(404).json({ error: "Service not found" });
    }

    const id      = uuidv4();
    const booking = {
      id,
      serviceId,
      providerId,
      clientId:      req.user.uid,
      serviceTitle:  serviceSnap.data().title,
      servicePrice:  serviceSnap.data().price,
      message,
      scheduledDate: scheduledDate || null,
      status:        "pending",
      createdAt:     new Date().toISOString(),
      updatedAt:     new Date().toISOString(),
    };

    await db.collection("bookings").doc(id).set(booking);

    return res.status(201).json({ message: "Booking created", booking });
  } catch (err) {
    console.error("[createBooking]", err);
    return res.status(500).json({ error: "Could not create booking" });
  }
}

/**
 * GET /api/bookings?role=client|provider
 */
async function getBookings(req, res) {
  const { role = "client" } = req.query;
  const field = role === "provider" ? "providerId" : "clientId";

  try {
    const snap     = await db.collection("bookings").where(field, "==", req.user.uid).get();
    const bookings = snap.docs.map((d) => d.data()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return res.status(200).json({ total: bookings.length, bookings });
  } catch (err) {
    console.error("[getBookings]", err);
    return res.status(500).json({ error: "Could not retrieve bookings" });
  }
}

/**
 * GET /api/bookings/:id
 */
async function getBooking(req, res) {
  try {
    const snap = await db.collection("bookings").doc(req.params.id).get();
    if (!snap.exists) return res.status(404).json({ error: "Booking not found" });

    const data = snap.data();
    if (data.clientId !== req.user.uid && data.providerId !== req.user.uid) {
      return res.status(403).json({ error: "You do not have access to this booking" });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("[getBooking]", err);
    return res.status(500).json({ error: "Could not retrieve booking" });
  }
}

/**
 * PUT /api/bookings/:id/status   (provider only)
 * Body: { status: "accepted" | "declined" | "completed" }
 */
async function updateBookingStatus(req, res) {
  const { status } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });
  }

  try {
    const snap = await db.collection("bookings").doc(req.params.id).get();
    if (!snap.exists) return res.status(404).json({ error: "Booking not found" });

    const data = snap.data();

    // Provider updates accepted/declined/completed; client can cancel their own bookings
    if (data.providerId !== req.user.uid && data.clientId !== req.user.uid) {
      return res.status(403).json({ error: "Access denied" });
    }
    if (data.clientId === req.user.uid && status !== "cancelled") {
      return res.status(403).json({ error: "Clients can only cancel bookings" });
    }

    await db.collection("bookings").doc(req.params.id).update({
      status,
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({ message: "Booking status updated", status });
  } catch (err) {
    console.error("[updateBookingStatus]", err);
    return res.status(500).json({ error: "Could not update booking status" });
  }
}

module.exports = { createBooking, getBookings, getBooking, updateBookingStatus };
