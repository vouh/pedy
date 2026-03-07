// ─────────────────────────────────────────────────────────────────────────────
// firebase-init.js  –  Initialises and exports shared Firebase services
// ─────────────────────────────────────────────────────────────────────────────
import { initializeApp }  from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { firebaseConfig } from "../env.js";

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);
