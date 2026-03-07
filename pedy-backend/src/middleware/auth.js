/**
 * Firebase ID-token verification middleware.
 *
 * Attaches `req.user` (the decoded token) to the request if the
 * Authorization header contains a valid Bearer token issued by Firebase Auth.
 *
 * Usage:
 *   router.use(authenticate);          // all routes
 *   router.post("/", authenticate, …); // single route
 */

const { adminAuth } = require("../config/firebase");

/**
 * Require a valid Firebase ID token.
 */
async function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Unauthorised – missing token" });
  }

  try {
    req.user = await adminAuth.verifyIdToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorised – invalid or expired token" });
  }
}

/**
 * Require the authenticated user to have role === "admin" in their Firestore
 * user document.  Must be used **after** `authenticate`.
 */
async function requireAdmin(req, res, next) {
  const { db } = require("../config/firebase");

  try {
    const snap = await db.collection("users").doc(req.user.uid).get();
    if (!snap.exists || snap.data().role !== "admin") {
      return res.status(403).json({ error: "Forbidden – admin access only" });
    }
    next();
  } catch (err) {
    return res.status(500).json({ error: "Could not verify admin role" });
  }
}

/**
 * Require the authenticated user to have role === "provider".
 * Must be used **after** `authenticate`.
 */
async function requireProvider(req, res, next) {
  const { db } = require("../config/firebase");

  try {
    const snap = await db.collection("users").doc(req.user.uid).get();
    if (!snap.exists || !["provider", "admin"].includes(snap.data().role)) {
      return res.status(403).json({ error: "Forbidden – provider access only" });
    }
    next();
  } catch (err) {
    return res.status(500).json({ error: "Could not verify provider role" });
  }
}

module.exports = { authenticate, requireAdmin, requireProvider };
