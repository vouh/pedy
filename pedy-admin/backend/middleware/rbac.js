/**
 * PEDY Admin – Role-Based Access Control (RBAC)
 *
 * Authentication: Firebase ID tokens (same Firebase project as pedy-backend).
 *
 * Admin accounts are stored in Firestore at: admins/{uid}
 * Document shape: { uid, name, email, role }
 *
 * Roles:
 *  super_admin       – full access to everything
 *  content_moderator – users + services (read/write), payments (read-only)
 *  payment_manager   – payments (full), users + services (read-only)
 *
 * How to create an admin account:
 *  1. Create the Firebase Auth account normally (via Firebase Console or the
 *     user-facing app).
 *  2. In Firestore, create the document:
 *       admins/{uid} = { uid, name, email, role: "super_admin" }
 */

// ─── Permission map ───────────────────────────────────────────────────────────
const PERMISSIONS = {
  super_admin: {
    users:    ["read", "write", "suspend", "ban"],
    services: ["read", "write", "approve", "reject", "remove"],
    payments: ["read", "refund", "resolve", "flag", "export"],
    admins:   ["read", "write"],
    settings: ["read", "write"],
  },
  content_moderator: {
    users:    ["read", "write", "suspend"],
    services: ["read", "write", "approve", "reject", "remove"],
    payments: ["read"],
    admins:   [],
    settings: [],
  },
  payment_manager: {
    users:    ["read"],
    services: ["read"],
    payments: ["read", "refund", "resolve", "flag", "export"],
    admins:   [],
    settings: [],
  },
};

function hasPermission(role, resource, action) {
  const perms = PERMISSIONS[role];
  if (!perms) return false;
  const actions = perms[resource];
  if (!actions) return false;
  return actions.includes(action);
}

// ─── Firebase token authentication middleware ─────────────────────────────────
const { adminAuth, db } = require("../config/firebase");

/**
 * Verify the Firebase ID token in the Authorization header.
 * Looks up the admin record in Firestore admins/{uid}.
 * Attaches req.admin = { uid, name, email, role } on success.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = await adminAuth.verifyIdToken(token);

    // Look up the admin record in Firestore
    const snap = await db.collection("admins").doc(decoded.uid).get();
    if (!snap.exists) {
      return res
        .status(403)
        .json({ error: "Access denied – account is not registered as an admin" });
    }

    req.admin = { uid: decoded.uid, ...snap.data() };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ─── RBAC middleware factory ──────────────────────────────────────────────────
/**
 * Usage: router.get("/", authenticate, authorize("users", "read"), handler)
 */
function authorize(resource, action) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!hasPermission(req.admin.role, resource, action)) {
      return res.status(403).json({
        error: `Access denied. Role '${req.admin.role}' cannot perform '${action}' on '${resource}'.`,
      });
    }
    next();
  };
}

module.exports = { authenticate, authorize, hasPermission, PERMISSIONS };
