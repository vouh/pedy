/**
 * Admin Controller
 * Protected endpoints for the PEDY Admin Panel.
 *
 * Auth:
 *   POST   /api/admin/auth/verify          – verify Firebase token + return admin profile
 *
 * Users:
 *   GET    /api/admin/users                – list all users (normalised)
 *   PUT    /api/admin/users/:uid/status    – legacy: set isActive boolean
 *   PUT    /api/admin/users/:uid/role      – change role
 *   PATCH  /api/admin/users/:uid/approve   – set status → active
 *   PATCH  /api/admin/users/:uid/suspend   – set status → suspended
 *   PATCH  /api/admin/users/:uid/reinstate – set status → active
 *   DELETE /api/admin/users/:uid           – permanently remove user
 *
 * Services:
 *   GET    /api/admin/services             – list all services (normalised)
 *   PUT    /api/admin/services/:id/status  – legacy: set isActive boolean
 *   PATCH  /api/admin/services/:id/approve – set status → approved
 *   PATCH  /api/admin/services/:id/reject  – set status → rejected
 *   DELETE /api/admin/services/:id         – remove service
 *
 * Bookings:
 *   GET    /api/admin/bookings             – list all bookings
 *
 * Payments:
 *   GET    /api/admin/payments             – list all payments (normalised)
 *   GET    /api/admin/payments/export/csv  – download CSV
 *   PATCH  /api/admin/payments/:id/refund
 *   PATCH  /api/admin/payments/:id/resolve
 *   PATCH  /api/admin/payments/:id/flag
 *   PATCH  /api/admin/payments/:id/clear-flag
 *
 * Analytics:
 *   GET    /api/admin/analytics            – platform-wide stats
 */

const { db, adminAuth } = require("../config/firebase");

/* ─────────────────────── Helpers ──────────────────────────────────── */

function fmtDate(val) {
  if (!val) return "—";
  if (val && typeof val.toDate === "function")
    return val.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (val && val._seconds)
    return new Date(val._seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function normaliseUser(id, data) {
  return {
    id:       id,
    uid:      id,
    name:     data.displayName || data.name || "Unknown",
    email:    data.email || "—",
    role:     data.role  || "client",
    status:   data.status || (data.isActive === false ? "suspended" : "active"),
    joined:   fmtDate(data.createdAt),
    location: data.location || "—",
    photoURL: data.photoURL  || null,
    bio:      data.bio       || "",
  };
}

function normaliseService(id, data) {
  return {
    id:       id,
    title:    data.title || "Untitled",
    provider: data.providerName || data.provider || "—",
    category: data.category || data.type || "general",
    price: data.currency
      ? `${data.currency === "KES" ? "KES " : "$"}${data.price ?? "—"}`
      : `$${data.price ?? "—"}`,
    status:    data.status || (data.isActive === false ? "rejected" : "approved"),
    createdAt: fmtDate(data.createdAt),
  };
}

function normalisePayment(id, data) {
  return {
    id:          id,
    clientName:  data.clientName  || data.client  || "—",
    serviceName: data.serviceName || data.service || "—",
    amount: data.currency === "KES"
      ? `KES ${data.amount ?? "—"}`
      : `$${data.amount ?? "—"}`,
    amountRaw: data.amount   || 0,
    currency:  data.currency || "USD",
    method:    data.method   || data.paymentMethod || "card",
    status:    data.status   || "pending",
    date:      fmtDate(data.createdAt),
  };
}

/* ─────────────────────── Auth Verify ──────────────────────────────── */

async function verifyAdmin(req, res) {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: "idToken is required" });

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const snap    = await db.collection("users").doc(decoded.uid).get();

    if (!snap.exists || snap.data().role !== "admin") {
      return res.status(403).json({ error: "Access denied – not an admin account" });
    }

    const data = snap.data();
    return res.status(200).json({
      admin: {
        uid:   decoded.uid,
        name:  data.displayName || data.name || decoded.email,
        email: decoded.email,
        role:  data.role,
      },
      token: idToken,
    });
  } catch (err) {
    console.error("[admin.verifyAdmin]", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/* ─────────────────────────── Users ─────────────────────────────────── */

async function listUsers(req, res) {
  const { role, status, q, limit = 200, offset = 0 } = req.query;
  try {
    let query = db.collection("users");
    if (role)   query = query.where("role",   "==", role);
    if (status) query = query.where("status", "==", status);
    const snap  = await query.get();
    let users   = snap.docs.map((d) => normaliseUser(d.id, d.data()));
    if (q) {
      const lq = q.toLowerCase();
      users = users.filter((u) => u.name.toLowerCase().includes(lq) || u.email.toLowerCase().includes(lq));
    }
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
  if (typeof isActive !== "boolean") return res.status(400).json({ error: "isActive must be a boolean" });
  try {
    await db.collection("users").doc(uid).update({ isActive, status: isActive ? "active" : "suspended", updatedAt: new Date().toISOString() });
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
  if (!validRoles.includes(role)) return res.status(400).json({ error: `role must be one of: ${validRoles.join(", ")}` });
  try {
    await db.collection("users").doc(uid).update({ role, updatedAt: new Date().toISOString() });
    return res.status(200).json({ message: `User role updated to ${role}` });
  } catch (err) {
    console.error("[admin.updateUserRole]", err);
    return res.status(500).json({ error: "Could not update user role" });
  }
}

async function approveUser(req, res) {
  const { uid } = req.params;
  try {
    await db.collection("users").doc(uid).update({ status: "active", isActive: true, updatedAt: new Date().toISOString() });
    await adminAuth.updateUser(uid, { disabled: false }).catch(() => {});
    return res.status(200).json({ message: "User approved" });
  } catch (err) {
    console.error("[admin.approveUser]", err);
    return res.status(500).json({ error: "Could not approve user" });
  }
}

async function suspendUser(req, res) {
  const { uid } = req.params;
  try {
    await db.collection("users").doc(uid).update({ status: "suspended", isActive: false, updatedAt: new Date().toISOString() });
    await adminAuth.updateUser(uid, { disabled: true }).catch(() => {});
    return res.status(200).json({ message: "User suspended" });
  } catch (err) {
    console.error("[admin.suspendUser]", err);
    return res.status(500).json({ error: "Could not suspend user" });
  }
}

async function reinstateUser(req, res) {
  const { uid } = req.params;
  try {
    await db.collection("users").doc(uid).update({ status: "active", isActive: true, updatedAt: new Date().toISOString() });
    await adminAuth.updateUser(uid, { disabled: false }).catch(() => {});
    return res.status(200).json({ message: "User reinstated" });
  } catch (err) {
    console.error("[admin.reinstateUser]", err);
    return res.status(500).json({ error: "Could not reinstate user" });
  }
}

async function deleteUser(req, res) {
  const { uid } = req.params;
  try {
    await db.collection("users").doc(uid).delete();
    await adminAuth.deleteUser(uid).catch(() => {});
    return res.status(200).json({ message: "User permanently removed" });
  } catch (err) {
    console.error("[admin.deleteUser]", err);
    return res.status(500).json({ error: "Could not delete user" });
  }
}

/* ─────────────────────────── Services ──────────────────────────────── */

async function listAllServices(req, res) {
  const { status, q, limit = 200, offset = 0 } = req.query;
  try {
    let query = db.collection("services");
    if (status) query = query.where("status", "==", status);
    const snap     = await query.get();
    let services   = snap.docs.map((d) => normaliseService(d.id, d.data()));
    if (q) {
      const lq = q.toLowerCase();
      services = services.filter((s) => s.title.toLowerCase().includes(lq) || s.provider.toLowerCase().includes(lq));
    }
    const paged = services.slice(Number(offset), Number(offset) + Number(limit));
    return res.status(200).json({ total: services.length, services: paged });
  } catch (err) {
    console.error("[admin.listAllServices]", err);
    return res.status(500).json({ error: "Could not retrieve services" });
  }
}

async function updateServiceStatus(req, res) {
  const { id }       = req.params;
  const { isActive } = req.body;
  if (typeof isActive !== "boolean") return res.status(400).json({ error: "isActive must be a boolean" });
  try {
    await db.collection("services").doc(id).update({ isActive, status: isActive ? "approved" : "rejected", updatedAt: new Date().toISOString() });
    return res.status(200).json({ message: `Service ${isActive ? "activated" : "deactivated"}` });
  } catch (err) {
    console.error("[admin.updateServiceStatus]", err);
    return res.status(500).json({ error: "Could not update service status" });
  }
}

async function approveService(req, res) {
  const { id } = req.params;
  try {
    await db.collection("services").doc(id).update({ status: "approved", isActive: true, updatedAt: new Date().toISOString() });
    return res.status(200).json({ message: "Service approved" });
  } catch (err) {
    console.error("[admin.approveService]", err);
    return res.status(500).json({ error: "Could not approve service" });
  }
}

async function rejectService(req, res) {
  const { id }    = req.params;
  const { reason } = req.body;
  try {
    const update = { status: "rejected", isActive: false, updatedAt: new Date().toISOString() };
    if (reason) update.rejectionReason = reason;
    await db.collection("services").doc(id).update(update);
    return res.status(200).json({ message: "Service rejected" });
  } catch (err) {
    console.error("[admin.rejectService]", err);
    return res.status(500).json({ error: "Could not reject service" });
  }
}

async function deleteService(req, res) {
  const { id } = req.params;
  try {
    await db.collection("services").doc(id).delete();
    return res.status(200).json({ message: "Service removed" });
  } catch (err) {
    console.error("[admin.deleteService]", err);
    return res.status(500).json({ error: "Could not delete service" });
  }
}

/* ─────────────────────────── Bookings ──────────────────────────────── */

async function listAllBookings(req, res) {
  const { status, limit = 200, offset = 0 } = req.query;
  try {
    let query = db.collection("bookings");
    if (status) query = query.where("status", "==", status);
    const snap     = await query.get();
    const bookings = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
                             .slice(Number(offset), Number(offset) + Number(limit));
    return res.status(200).json({ total: snap.size, bookings });
  } catch (err) {
    console.error("[admin.listAllBookings]", err);
    return res.status(500).json({ error: "Could not retrieve bookings" });
  }
}

/* ─────────────────────────── Payments ──────────────────────────────── */

async function listAllPayments(req, res) {
  const { status, method, q, limit = 200, offset = 0 } = req.query;
  try {
    let query = db.collection("payments");
    if (status) query = query.where("status", "==", status);
    if (method) query = query.where("method", "==", method);
    const snap   = await query.get();
    let payments = snap.docs.map((d) => normalisePayment(d.id, d.data()));
    if (q) {
      const lq = q.toLowerCase();
      payments = payments.filter((t) =>
        t.id.toLowerCase().includes(lq) ||
        t.clientName.toLowerCase().includes(lq) ||
        t.serviceName.toLowerCase().includes(lq)
      );
    }
    const paged = payments.slice(Number(offset), Number(offset) + Number(limit));
    return res.status(200).json({ total: payments.length, payments: paged });
  } catch (err) {
    console.error("[admin.listAllPayments]", err);
    return res.status(500).json({ error: "Could not retrieve payments" });
  }
}

async function refundPayment(req, res) {
  const { id } = req.params;
  const { note } = req.body;
  try {
    const u = { status: "refunded", updatedAt: new Date().toISOString() };
    if (note) u.adminNote = note;
    await db.collection("payments").doc(id).update(u);
    return res.status(200).json({ message: "Payment refunded" });
  } catch (err) {
    console.error("[admin.refundPayment]", err);
    return res.status(500).json({ error: "Could not process refund" });
  }
}

async function resolvePayment(req, res) {
  const { id } = req.params;
  const { note } = req.body;
  try {
    const u = { status: "completed", updatedAt: new Date().toISOString() };
    if (note) u.adminNote = note;
    await db.collection("payments").doc(id).update(u);
    return res.status(200).json({ message: "Payment resolved" });
  } catch (err) {
    console.error("[admin.resolvePayment]", err);
    return res.status(500).json({ error: "Could not resolve payment" });
  }
}

async function flagPayment(req, res) {
  const { id } = req.params;
  const { note } = req.body;
  try {
    const u = { status: "flagged", updatedAt: new Date().toISOString() };
    if (note) u.adminNote = note;
    await db.collection("payments").doc(id).update(u);
    return res.status(200).json({ message: "Payment flagged" });
  } catch (err) {
    console.error("[admin.flagPayment]", err);
    return res.status(500).json({ error: "Could not flag payment" });
  }
}

async function clearFlagPayment(req, res) {
  const { id } = req.params;
  const { note } = req.body;
  try {
    const u = { status: "completed", updatedAt: new Date().toISOString() };
    if (note) u.adminNote = note;
    await db.collection("payments").doc(id).update(u);
    return res.status(200).json({ message: "Flag cleared" });
  } catch (err) {
    console.error("[admin.clearFlagPayment]", err);
    return res.status(500).json({ error: "Could not clear flag" });
  }
}

async function exportPaymentsCsv(req, res) {
  try {
    const snap     = await db.collection("payments").get();
    const payments = snap.docs.map((d) => normalisePayment(d.id, d.data()));
    const header   = ["Txn ID", "Client", "Service", "Amount", "Method", "Status", "Date"];
    const rows     = payments.map((t) =>
      [t.id, t.clientName, t.serviceName, t.amount, t.method, t.status, t.date]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
    );
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=pedy_payments_report.csv");
    return res.send([header.join(","), ...rows].join("\n"));
  } catch (err) {
    console.error("[admin.exportPaymentsCsv]", err);
    return res.status(500).json({ error: "Could not export payments" });
  }
}

/* ─────────────────────────── Analytics ─────────────────────────────── */

async function getAnalytics(req, res) {
  try {
    const [usersSnap, servicesSnap, bookingsSnap, paymentsSnap] = await Promise.all([
      db.collection("users").get(),
      db.collection("services").get(),
      db.collection("bookings").get(),
      db.collection("payments").get(),
    ]);

    const users    = usersSnap.docs.map((d)    => d.data());
    const services = servicesSnap.docs.map((d) => d.data());
    const bookings = bookingsSnap.docs.map((d) => d.data());
    const payments = paymentsSnap.docs.map((d) => d.data());

    const successPayments = payments.filter((p) => ["completed", "success"].includes(p.status));
    const totalRevenue    = successPayments.reduce((s, p) => {
      const amt = Number(p.amount) || 0;
      return s + (p.currency === "USD" ? amt : amt / 130);
    }, 0);

    return res.status(200).json({
      users: {
        total:     usersSnap.size,
        clients:   users.filter((u) => u.role === "client").length,
        providers: users.filter((u) => u.role === "provider").length,
        admins:    users.filter((u) => u.role === "admin").length,
        active:    users.filter((u) => u.isActive !== false && u.status !== "suspended").length,
        pending:   users.filter((u) => u.status === "pending").length,
        suspended: users.filter((u) => u.status === "suspended" || u.isActive === false).length,
      },
      services: {
        total:    servicesSnap.size,
        active:   services.filter((s) => s.isActive !== false).length,
        pending:  services.filter((s) => s.status === "pending").length,
        approved: services.filter((s) => s.status === "approved" || (s.isActive === true && !s.status)).length,
        rejected: services.filter((s) => s.status === "rejected" || s.isActive === false).length,
      },
      bookings: {
        total:     bookingsSnap.size,
        pending:   bookings.filter((b) => b.status === "pending").length,
        accepted:  bookings.filter((b) => b.status === "accepted").length,
        completed: bookings.filter((b) => b.status === "completed").length,
        declined:  bookings.filter((b) => b.status === "declined").length,
        cancelled: bookings.filter((b) => b.status === "cancelled").length,
      },
      payments: {
        total:        paymentsSnap.size,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        revenue_usd:  Math.round(totalRevenue * 100) / 100,
        disputed:     payments.filter((p) => p.status === "disputed").length,
        flagged:      payments.filter((p) => p.status === "flagged").length,
        refunded:     payments.filter((p) => p.status === "refunded").length,
        currency:     "USD (approx)",
      },
    });
  } catch (err) {
    console.error("[admin.getAnalytics]", err);
    return res.status(500).json({ error: "Could not retrieve analytics" });
  }
}

/* ─────────────────────────── Activity Log ──────────────────────────────── */

async function getActivityLog(req, res) {
  const { limit: lim = 20 } = req.query;
  try {
    const snap = await db.collection("adminLogs")
      .orderBy("createdAt", "desc")
      .limit(Number(lim))
      .get();
    const logs = snap.docs.map((d) => {
      const data = d.data();
      return {
        id:        d.id,
        adminName: data.adminName || "Admin",
        adminRole: data.adminRole || "admin",
        action:    data.action    || "updated",
        target:    data.target    || "—",
        time:      fmtDate(data.createdAt),
        createdAt: data.createdAt,
      };
    });
    return res.status(200).json({ logs });
  } catch (err) {
    console.error("[admin.getActivityLog]", err);
    return res.status(500).json({ error: "Could not retrieve activity log" });
  }
}

module.exports = {
  verifyAdmin,
  listUsers,
  updateUserStatus,
  updateUserRole,
  approveUser,
  suspendUser,
  reinstateUser,
  deleteUser,
  listAllServices,
  updateServiceStatus,
  approveService,
  rejectService,
  deleteService,
  listAllBookings,
  listAllPayments,
  refundPayment,
  resolvePayment,
  flagPayment,
  clearFlagPayment,
  exportPaymentsCsv,
  getAnalytics,
  getActivityLog,
};
