// ─────────────────────────────────────────────────────────────────────────────
// Firebase Configuration Template
// ─────────────────────────────────────────────────────────────────────────────
// 1. Copy this file:  cp env.example.js env.js
// 2. Replace every placeholder below with your actual Firebase project values.
// 3. env.js is listed in .gitignore – it will never be committed.
// ─────────────────────────────────────────────────────────────────────────────

export const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "1:YOUR_MESSAGING_SENDER_ID:web:YOUR_APP_ID",
  measurementId:     "G-YOUR_MEASUREMENT_ID"   // optional
};
