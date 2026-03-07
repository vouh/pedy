/**
 * Firebase Admin SDK initialisation.
 * Exports the Firestore `db` instance and Firebase Admin `auth` instance
 * for use across all route controllers.
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
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./service-account.json"
  );

  if (!fs.existsSync(serviceAccountPath)) {
    console.error(
      `[Firebase] Service account not found at: ${serviceAccountPath}\n` +
      `Provide the path via FIREBASE_SERVICE_ACCOUNT_PATH in .env`
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
