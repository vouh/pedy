/**
 * Admin Controller
 * Protected endpoints for platform administrators.
 *
 * Endpoints:
 *   GET    /api/admin/users                – list all users
 *   PUT    /api/admin/users/:uid/status    – activate / deactivate a user
 *   PUT    /api/admin/users/:uid/role      – change user role
 *   GET    /api/admin/services             – list all services (including inactive)
 *   PUT    /api/admin/services/:id/status  – activate / deactivate a service
 *   GET    /api/admin/bookings             – list all bookings
 *   GET    /api/admin/payments             – list all payments
 *   GET    /api/admin/analytics            – platform-wide stats
 */

const { db, adminAuth } = require("../config/firebase");

/* ─────────────────────────── Users ─────────────────────────────────── */

async function listUsers(req, res) {
  const { role, limit = 50, offset = 0 } = req.query;

  try {
    let query = db.collection("users");
    if (role) query = query.where("role", "==", role);

    const snap  = await query.get();
    let users   = snap.docs.map((d) => d.data());

    const total = users.length;
    const paged = users.slice(Number(offset), Number(offset) + Number(limit));

    return res.status(200).json({ total, users: paged });
  } catch (err) {
    console.error("[admin.listUsers]", err);
    return res.status(500).json({ error: "Could not retrieve users" });
  }
}

async function updateUserStatus(req, res) {
  const { uid }      = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== "boolean") {
    return res.status(400).json({ error: "isActive must be a boolean" });
  }

  try {
    await db.collection("users").doc(uid).update({ isActive, updatedAt: new Date().toISOString() });

    // Also disable / enable the Firebase Auth account
    await adminAuth.updateUser(uid, { disabled: !isActive });

    return res.status(200).json({ message: `User ${isActive ? "activated" : "deactivated"}` });
  } catch (err) {
    console.error("[admin.updateUserStatus]", err);
    return res.status(500).json({ error: "Could not update user status" });
  }
}

async function updateUserRole(req, res) {
  const { uid }  = req.params;
  const { role } = req.body;

  const validRoles = ["client", "provider", "admin"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: `role must be one of: ${validRoles.join(", ")}` });
  }

  try {
    await db.collection("users").doc(uid).update({ role, updatedAt: new Date().toISOString() });
    return res.status(200).json({ message: `User role updated to ${role}` });
  } catch (err) {
    console.error("[admin.updateUserRole]", err);
    return res.status(500).json({ error: "Could not update user role" });
  }
}

/* ─────────────────────────── Services ──────────────────────────────── */

async function listAllServices(req, res) {
  const { limit = 50, offset = 0 } = req.query;

  try {
    const snap     = await db.collection("services").get();
    const services = snap.docs.map((d) => d.data()).slice(Number(offset), Number(offset) + Number(limit));
    return res.status(200).json({ total: snap.size, services });
  } catch (err) {
    console.error("[admin.listAllServices]", err);
    return res.status(500).json({ error: "Could not retrieve services" });
  }
}

async function updateServiceStatus(req, res) {
  const { id }       = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== "boolean") {
    return res.status(400).json({ error: "isActive must be a boolean" });
  }

  try {
    await db.collection("services").doc(id).update({ isActive, updatedAt: new Date().toISOString() });
    return res.status(200).json({ message: `Service ${isActive ? "activated" : "deactivated"}` });
  } catch (err) {
    console.error("[admin.updateServiceStatus]", err);
    return res.status(500).json({ error: "Could not update service status" });
  }
}

/* ─────────────────────────── Bookings ──────────────────────────────── */

async function listAllBookings(req, res) {
  const { status, limit = 50, offset = 0 } = req.query;

  try {
    let query = db.collection("bookings");
    if (status) query = query.where("status", "==", status);

    const snap     = await query.get();
    const bookings = snap.docs.map((d) => d.data()).slice(Number(offset), Number(offset) + Number(limit));
    return res.status(200).json({ total: snap.size, bookings });
  } catch (err) {
    console.error("[admin.listAllBookings]", err);
    return res.status(500).json({ error: "Could not retrieve bookings" });
  }
}

/* ─────────────────────────── Payments ──────────────────────────────── */

async function listAllPayments(req, res) {
  const { status, limit = 50, offset = 0 } = req.query;

  try {
    let query = db.collection("payments");
    if (status) query = query.where("status", "==", status);

    const snap     = await query.get();
    const payments = snap.docs.map((d) => d.data()).slice(Number(offset), Number(offset) + Number(limit));
    return res.status(200).json({ total: snap.size, payments });
  } catch (err) {
    console.error("[admin.listAllPayments]", err);
    return res.status(500).json({ error: "Could not retrieve payments" });
  }
}

/* ─────────────────────────── Analytics ─────────────────────────────── */

async function getAnalytics(req, res) {
  try {
    const [usersSnap, servicesSnap, bookingsSnap, paymentsSnap] = await Promise.all([
      db.collection("users").get(),
      db.collection("services").get(),
      db.collection("bookings").get(),
      db.collection("payments").where("status", "==", "success").get(),
    ]);

    const users    = usersSnap.docs.map((d) => d.data());
    const bookings = bookingsSnap.docs.map((d) => d.data());
    const payments = paymentsSnap.docs.map((d) => d.data());

    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const analytics = {
      users: {
        total:     usersSnap.size,
        clients:   users.filter((u) => u.role === "client").length,
        providers: users.filter((u) => u.role === "provider").length,
        admins:    users.filter((u) => u.role === "admin").length,
        active:    users.filter((u) => u.isActive !== false).length,
      },
      services: {
        total:    servicesSnap.size,
        active:   0, // computed below
      },
      bookings: {
        total:     bookingsSnap.size,
        pending:   bookings.filter((b) => b.status === "pending").length,
        accepted:  bookings.filter((b) => b.status === "accepted").length,
        completed: bookings.filter((b) => b.status === "completed").length,
        declined:  bookings.filter((b) => b.status === "declined").length,
      },
      payments: {
        total:         paymentsSnap.size,
        totalRevenue,
        currency:      "KES / USD",
      },
    };

    return res.status(200).json(analytics);
  } catch (err) {
    console.error("[admin.getAnalytics]", err);
    return res.status(500).json({ error: "Could not retrieve analytics" });
  }
}

module.exports = {
  listUsers,
  updateUserStatus,
  updateUserRole,
  listAllServices,
  updateServiceStatus,
  listAllBookings,
  listAllPayments,
  getAnalytics,
};
