/**
 * PEDY Admin – Role-Based Access Control (RBAC)
 *
 * Roles:
 *  super_admin       – full access to everything
 *  content_moderator – users + services (read/write), payments (read-only)
 *  payment_manager   – payments (full), users + services (read-only)
 */

// ─── Permission map ───────────────────────────────────────────────────────────
const PERMISSIONS = {
  super_admin: {
    users: ["read", "write", "suspend", "ban"],
    services: ["read", "write", "approve", "reject", "remove"],
    payments: ["read", "refund", "resolve", "flag", "export"],
    admins: ["read", "write"], // manage other admin accounts
    settings: ["read", "write"],
  },
  content_moderator: {
    users: ["read", "write", "suspend"],
    services: ["read", "write", "approve", "reject", "remove"],
    payments: ["read"], // read-only
    admins: [],
    settings: [],
  },
  payment_manager: {
    users: ["read"], // read-only
    services: ["read"], // read-only
    payments: ["read", "refund", "resolve", "flag", "export"],
    admins: [],
    settings: [],
  },
};

/**
 * Check whether a role has a specific action on a resource.
 * @param {string} role   – admin role
 * @param {string} resource – e.g. "users", "services", "payments"
 * @param {string} action   – e.g. "read", "write", "approve", "refund"
 */
function hasPermission(role, resource, action) {
  const perms = PERMISSIONS[role];
  if (!perms) return false;
  const actions = perms[resource];
  if (!actions) return false;
  return actions.includes(action);
}

// ─── JWT Authentication middleware ───────────────────────────────────────────
const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or invalid Authorization header" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded; // { id, email, name, role }
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
