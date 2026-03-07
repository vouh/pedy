/**
 * Auth Controller
 * Handles user registration and login via Firebase Admin SDK.
 *
 * Note: Firebase Auth primary sign-in happens client-side (Firebase SDK).
 * These endpoints handle:
 *   - POST /api/auth/register – create FirebaseAuth user + Firestore profile
 *   - POST /api/auth/login    – validate credentials and return a custom token
 *   - GET  /api/auth/me       – return the current user's Firestore profile
 */

const { db, adminAuth } = require("../config/firebase");

/**
 * POST /api/auth/register
 * Body: { email, password, displayName, role? }
 */
async function register(req, res) {
  const { email, password, displayName, role = "client" } = req.body;

  if (!email || !password || !displayName) {
    return res.status(400).json({ error: "email, password and displayName are required" });
  }

  if (!["client", "provider"].includes(role)) {
    return res.status(400).json({ error: "role must be 'client' or 'provider'" });
  }

  try {
    // 1. Create the Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    // 2. Create the Firestore profile document
    const profile = {
      uid:         userRecord.uid,
      email:       userRecord.email,
      displayName: userRecord.displayName,
      role,
      bio:         "",
      location:    "",
      photoURL:    "",
      skills:      [],
      isActive:    true,
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
    };

    await db.collection("users").doc(userRecord.uid).set(profile);

    // 3. Return a custom token so the client can immediately sign in
    const customToken = await adminAuth.createCustomToken(userRecord.uid);

    return res.status(201).json({
      message: "Registration successful",
      uid:     userRecord.uid,
      token:   customToken,
      profile,
    });
  } catch (err) {
    if (err.code === "auth/email-already-exists") {
      return res.status(409).json({ error: "An account with this email already exists" });
    }
    console.error("[register]", err);
    return res.status(500).json({ error: "Registration failed. Please try again." });
  }
}

/**
 * POST /api/auth/login
 * Firebase client SDK should handle login; this endpoint is for
 * server-side scenarios (e.g. mobile/external clients) that need a
 * custom token after verifying via Admin SDK.
 * Body: { uid } – after client-side verification, exchange for custom token.
 */
async function login(req, res) {
  const { uid } = req.body;

  if (!uid) {
    return res.status(400).json({
      error: "Provide the Firebase UID obtained after client-side authentication",
    });
  }

  try {
    const userRecord = await adminAuth.getUser(uid);

    if (!userRecord.disabled === false) {
      return res.status(403).json({ error: "This account has been disabled" });
    }

    const snap    = await db.collection("users").doc(uid).get();
    const profile = snap.exists ? snap.data() : null;
    const token   = await adminAuth.createCustomToken(uid);

    return res.status(200).json({
      message: "Login successful",
      uid,
      token,
      profile,
    });
  } catch (err) {
    console.error("[login]", err);
    return res.status(401).json({ error: "Authentication failed" });
  }
}

/**
 * GET /api/auth/me  (requires authenticate middleware)
 */
async function getMe(req, res) {
  try {
    const snap = await db.collection("users").doc(req.user.uid).get();
    if (!snap.exists) {
      return res.status(404).json({ error: "User profile not found" });
    }
    return res.status(200).json(snap.data());
  } catch (err) {
    console.error("[getMe]", err);
    return res.status(500).json({ error: "Could not retrieve profile" });
  }
}

module.exports = { register, login, getMe };
