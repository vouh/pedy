// ─────────────────────────────────────────────────────────────────────────────
// auth.js  –  Authentication helpers (Firebase Auth + Firestore user records)
// ─────────────────────────────────────────────────────────────────────────────
import { auth, db } from "./firebase-init.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

// ── Register a new user ───────────────────────────────────────────────────────
export async function signUp(email, password, displayName, isProvider = false) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });

  // Persist user record in Firestore
  await setDoc(doc(db, "users", cred.user.uid), {
    uid:         cred.user.uid,
    email,
    displayName,
    role:        isProvider ? "provider" : "client",
    photoURL:    null,
    bio:         "",
    location:    "",
    skills:      [],
    createdAt:   serverTimestamp()
  });

  return cred.user;
}

// ── Sign in an existing user ──────────────────────────────────────────────────
export async function signIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

// ── Sign in / register with Google ───────────────────────────────────────────
export async function signInWithGoogle(isProvider = false) {
  const provider = new GoogleAuthProvider();
  const cred     = await signInWithPopup(auth, provider);
  const user     = cred.user;

  // Create a Firestore profile only on first sign-in
  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists()) {
    await setDoc(doc(db, "users", user.uid), {
      uid:         user.uid,
      email:       user.email,
      displayName: user.displayName || user.email.split("@")[0],
      role:        isProvider ? "provider" : "client",
      photoURL:    user.photoURL || null,
      bio:         "",
      location:    "",
      skills:      [],
      createdAt:   serverTimestamp()
    });
  }

  return user;
}

// ── Sign out ──────────────────────────────────────────────────────────────────
export async function logOut() {
  await signOut(auth);
}

// ── Auth state listener (returns unsubscribe fn) ──────────────────────────────
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ── Fetch Firestore profile for a user ───────────────────────────────────────
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}
