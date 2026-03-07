/**
 * Firebase Admin SDK initialisation for pedy-admin backend.
 * Shares the same Firebase project as pedy-backend.
 *
 * Requires: FIREBASE_SERVICE_ACCOUNT_PATH in .env
 *   → point to the same service-account.json used by pedy-backend
 *   → default: ../../pedy-backend/service-account.json (monorepo sibling)
 */

const admin = require("firebase-admin");
const path  = require("path");
const fs    = require("fs");

let db;
let adminAuth;

function initFirebase() {
  if (admin.apps.length > 0) {
    db        = admin.firestore();
    adminAuth = admin.auth();
    return;
  }

  const serviceAccountPath = path.resolve(
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      "../../pedy-backend/service-account.json"
  );

  if (!fs.existsSync(serviceAccountPath)) {
    console.error(
      `[Firebase] Service account not found at: ${serviceAccountPath}\n` +
      `Set FIREBASE_SERVICE_ACCOUNT_PATH in pedy-admin/backend/.env`
    );
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  db        = admin.firestore();
  adminAuth = admin.auth();

  console.log("[Firebase Admin] Initialised successfully");
}

initFirebase();

module.exports = { db, adminAuth, admin };
