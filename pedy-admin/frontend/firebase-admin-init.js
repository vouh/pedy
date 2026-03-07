/**
 * firebase-admin-init.js
 *
 * Loads the Firebase Auth SDK for the PEDY Admin Panel.
 * Must be included as a <script type="module"> in each admin HTML page.
 *
 * Exposes on window:
 *   getCurrentIdToken()  → Promise<string|null>   – returns a fresh Firebase ID token
 *   firebaseSignIn(email, password) → Promise<{admin, token}> – signs in via Firebase + verify API
 *   firebaseSignOut()    → Promise<void>
 *
 * Firebase config matches pedy-4a29f (same project as Front end/).
 */

import { initializeApp }           from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged }
                                   from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

const firebaseConfig = {
  apiKey:            "AIzaSyDrs58zWSKjSn_HjZcyASeFfswQFn_4nJI",
  authDomain:        "pedy-4a29f.firebaseapp.com",
  projectId:         "pedy-4a29f",
  storageBucket:     "pedy-4a29f.firebasestorage.app",
  messagingSenderId: "689001372029",
  appId:             "1:689001372029:web:b62fc8936a15aacd9a1414",
  measurementId:     "G-ST8J0174MJ",
};

const app  = initializeApp(firebaseConfig, "pedy-admin");
const auth = getAuth(app);

const API_BASE = "http://localhost:5000/api/admin";

/**
 * Returns a valid (possibly refreshed) Firebase ID token for the current user.
 * Falls back to the sessionStorage token if Auth hasn't loaded yet.
 */
window.getCurrentIdToken = async function () {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken(false);  // use cached unless ≤ 5 min left
    sessionStorage.setItem("pedy_token", token); // keep sessionStorage in sync
    return token;
  }
  return sessionStorage.getItem("pedy_token");
};

/**
 * Sign in with Firebase email + password, then verify via the admin API.
 * Returns { admin, token } on success.
 * Throws an Error with a user-friendly message on failure.
 */
window.firebaseSignIn = async function (email, password) {
  // Step 1: Firebase Auth sign-in
  const cred    = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await cred.user.getIdToken();

  // Step 2: Verify token + look up admin role on the backend
  const res  = await fetch(API_BASE + "/auth/verify", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ idToken }),
  });
  const data = await res.json();

  if (!res.ok) {
    // If the Firebase account doesn't have an admin record – sign out immediately
    await signOut(auth);
    throw new Error(data.error || "Access denied");
  }

  // Persist for other pages
  sessionStorage.setItem("pedy_admin", JSON.stringify(data.admin));
  sessionStorage.setItem("pedy_token", idToken);

  return data;
};

/**
 * Sign out from both Firebase and the admin session.
 */
window.firebaseSignOut = async function () {
  await signOut(auth);
  sessionStorage.removeItem("pedy_admin");
  sessionStorage.removeItem("pedy_token");
  window.location.href = "index.html";
};

// Keep token fresh on auth state changes (fires when token auto-refreshes)
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const token = await user.getIdToken(false);
    sessionStorage.setItem("pedy_token", token);
  }
});
