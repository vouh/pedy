// ─────────────────────────────────────────────────────────────────────────────
// db.js  –  All Firestore data operations for PEDY
// ─────────────────────────────────────────────────────────────────────────────
import { db } from "./firebase-init.js";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICES
// ═══════════════════════════════════════════════════════════════════════════════

/** Create a new service listing */
export async function createService(uid, data) {
  return await addDoc(collection(db, "services"), {
    ...data,
    providerId:  uid,
    rating:      0,
    reviewCount: 0,
    createdAt:   serverTimestamp()
  });
}

/**
 * Fetch services from Firestore.
 * Filtering is done client-side to avoid composite index requirements.
 * @param {Object} filters  – { category, searchTerm, maxPrice, minRating, limitN }
 */
export async function getServices(filters = {}) {
  const q     = query(collection(db, "services"), orderBy("createdAt", "desc"));
  const snap  = await getDocs(q);
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  if (filters.category && filters.category !== "all") {
    results = results.filter(s => s.category === filters.category);
  }
  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    results = results.filter(s =>
      s.title?.toLowerCase().includes(term)       ||
      s.description?.toLowerCase().includes(term) ||
      s.category?.toLowerCase().includes(term)    ||
      s.providerName?.toLowerCase().includes(term)
    );
  }
  if (filters.maxPrice) {
    results = results.filter(s => parseFloat(s.price) <= parseFloat(filters.maxPrice));
  }
  if (filters.minRating) {
    results = results.filter(s => (s.rating || 0) >= parseFloat(filters.minRating));
  }
  if (filters.limitN) {
    results = results.slice(0, filters.limitN);
  }
  return results;
}

/** Fetch all services by a given provider */
export async function getProviderServices(uid) {
  const q    = query(collection(db, "services"), where("providerId", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Fetch a single service by ID */
export async function getService(serviceId) {
  const snap = await getDoc(doc(db, "services", serviceId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Update a service */
export async function updateService(serviceId, data) {
  await updateDoc(doc(db, "services", serviceId), { ...data, updatedAt: serverTimestamp() });
}

/** Delete a service */
export async function deleteService(serviceId) {
  await deleteDoc(doc(db, "services", serviceId));
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER PROFILES
// ═══════════════════════════════════════════════════════════════════════════════

/** Merge-update a user's Firestore profile */
export async function updateUserProfile(uid, data) {
  await setDoc(
    doc(db, "users", uid),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/** Fetch a single user profile */
export async function getUserDoc(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOOKINGS
// ═══════════════════════════════════════════════════════════════════════════════

/** Create a booking request */
export async function createBooking(data) {
  return await addDoc(collection(db, "bookings"), {
    ...data,
    status:    "pending",
    createdAt: serverTimestamp()
  });
}

/** All bookings for a provider */
export async function getProviderBookings(providerId) {
  const q    = query(collection(db, "bookings"), where("providerId", "==", providerId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** All bookings made by a client */
export async function getClientBookings(clientId) {
  const q    = query(collection(db, "bookings"), where("clientId", "==", clientId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Update booking status */
export async function updateBookingStatus(bookingId, status) {
  await updateDoc(doc(db, "bookings", bookingId), { status, updatedAt: serverTimestamp() });
}

// ═══════════════════════════════════════════════════════════════════════════════
// REVIEWS
// ═══════════════════════════════════════════════════════════════════════════════

/** Post a review */
export async function createReview(data) {
  return await addDoc(collection(db, "reviews"), { ...data, createdAt: serverTimestamp() });
}

/** Reviews for a specific service */
export async function getServiceReviews(serviceId) {
  const q    = query(collection(db, "reviews"), where("serviceId", "==", serviceId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** All reviews a provider has received */
export async function getProviderReviews(providerId) {
  const q    = query(collection(db, "reviews"), where("providerId", "==", providerId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
