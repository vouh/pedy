/**
 * Admin Auth Routes
 *
 * Flow:
 *  1. Client signs in via Firebase Auth (email/password) in the browser using
 *     the Firebase JS SDK.
 *  2. Client calls POST /api/admin/auth/verify with the Firebase ID token.
 *  3. This endpoint verifies the token, looks up the admin record in Firestore,
 *     and returns the admin info + role.
 *  4. The frontend stores { admin, token } in sessionStorage for subsequent calls.
 *
 * Admin Firestore document: admins/{uid}
 *   { uid: string, name: string, email: string, role: "super_admin" | "content_moderator" | "payment_manager" }
 *
 * Create admin accounts manually in Firestore or via Firebase Console.
 */

const router = require("express").Router();
const { authenticate } = require("../middleware/rbac");
const { adminAuth, db } = require("../config/firebase");

/**
 * POST /api/admin/auth/verify
 * Body: { idToken }
 * Verifies a Firebase ID token and returns the admin's role info.
 */
router.post("/verify", async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: "idToken is required" });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);

    // Look up admin record in Firestore
    const snap = await db.collection("admins").doc(decoded.uid).get();
    if (!snap.exists) {
      return res.status(403).json({
        error: "Access denied – your account is not registered as a PEDY admin. Contact a super admin.",
      });
    }

    const adminData = snap.data();
    res.json({
      admin: {
        uid:   decoded.uid,
        name:  adminData.name  || decoded.name  || decoded.email,
        email: decoded.email,
        role:  adminData.role,
      },
      // Send the original idToken back – the frontend stores and re-sends it
      // as Bearer token on every API request.
      token: idToken,
    });
  } catch (err) {
    console.error("[auth/verify]", err);
    return res.status(401).json({ error: "Invalid or expired Firebase token" });
  }
});

/**
 * GET /api/admin/auth/me
 * Returns the current admin's info from the verified Firebase token.
 */
router.get("/me", authenticate, (req, res) => {
  res.json({ admin: req.admin });
});

module.exports = router;
