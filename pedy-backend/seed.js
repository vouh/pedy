/**
 * PEDY Firestore Seed Script
 * --------------------------
 * Populates the Firestore database with realistic sample data for
 * development and demo purposes.
 *
 * Usage:
 *   node seed.js              – seeds all collections
 *   node seed.js --clear      – clears all collections first, then seeds
 *
 * Prerequisites:
 *   • service-account.json must exist at ./service-account.json
 *   • Run `npm install` in pedy-backend first (needs firebase-admin)
 */

require("dotenv").config();

const admin = require("firebase-admin");
const path  = require("path");
const fs    = require("fs");

// ── Init Firebase ────────────────────────────────────────────────────────────
const svcPath = path.resolve(
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./service-account.json"
);

if (!fs.existsSync(svcPath)) {
  console.error(`\n❌  service-account.json not found at: ${svcPath}`);
  console.error(`    Download it from Firebase Console → Project Settings → Service Accounts\n`);
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(fs.readFileSync(svcPath))) });
const db = admin.firestore();

const CLEAR = process.argv.includes("--clear");

// ── Helpers ──────────────────────────────────────────────────────────────────
const TS  = (daysAgo = 0) => admin.firestore.Timestamp.fromDate(
  new Date(Date.now() - daysAgo * 86_400_000)
);

async function clearCollection(name) {
  const snap = await db.collection(name).get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  console.log(`  🗑  Cleared ${snap.size} docs from '${name}'`);
}

async function batchWrite(collection, docs) {
  const chunks = [];
  for (let i = 0; i < docs.length; i += 500)
    chunks.push(docs.slice(i, i + 500));

  for (const chunk of chunks) {
    const batch = db.batch();
    chunk.forEach(({ id, data }) => {
      const ref = id ? db.collection(collection).doc(id) : db.collection(collection).doc();
      batch.set(ref, data);
    });
    await batch.commit();
  }
  console.log(`  ✅  Seeded ${docs.length} docs into '${collection}'`);
}

// ── Sample Data ──────────────────────────────────────────────────────────────

const USERS = [
  // 1 admin
  {
    id: "admin_001",
    data: {
      displayName: "Kelvin Admin",
      email:       "admin@pedy.app",
      role:        "admin",
      status:      "active",
      isActive:    true,
      location:    "Nairobi, KE",
      bio:         "Platform administrator",
      createdAt:   TS(90),
    },
  },
  // Providers
  {
    id: "provider_001",
    data: {
      displayName: "Jane Wanjiku",
      email:       "jane.wanjiku@example.com",
      role:        "provider",
      status:      "active",
      isActive:    true,
      location:    "Nairobi, KE",
      skills:      ["web development", "UI/UX"],
      bio:         "Full-stack developer with 5 years experience.",
      createdAt:   TS(60),
    },
  },
  {
    id: "provider_002",
    data: {
      displayName: "Amina Hassan",
      email:       "amina.hassan@example.com",
      role:        "provider",
      status:      "active",
      isActive:    true,
      location:    "Mombasa, KE",
      skills:      ["photography", "videography"],
      bio:         "Professional photographer specialising in brand shoots.",
      createdAt:   TS(45),
    },
  },
  {
    id: "provider_003",
    data: {
      displayName: "Chris Mwangi",
      email:       "chris.mwangi@example.com",
      role:        "provider",
      status:      "pending",
      isActive:    false,
      location:    "Kisumu, KE",
      skills:      ["personal training", "nutrition"],
      bio:         "Certified personal trainer.",
      createdAt:   TS(5),
    },
  },
  {
    id: "provider_004",
    data: {
      displayName: "Grace Njeri",
      email:       "grace.njeri@example.com",
      role:        "provider",
      status:      "pending",
      isActive:    false,
      location:    "Nakuru, KE",
      skills:      ["hair braiding", "beauty"],
      bio:         "Expert in traditional and modern hair styling.",
      createdAt:   TS(3),
    },
  },
  {
    id: "provider_005",
    data: {
      displayName: "David Kim",
      email:       "david.kim@example.com",
      role:        "provider",
      status:      "suspended",
      isActive:    false,
      location:    "Nairobi, KE",
      skills:      ["cybersecurity"],
      bio:         "Cybersecurity consultant.",
      createdAt:   TS(30),
    },
  },
  {
    id: "provider_006",
    data: {
      displayName: "Fatuma Ali",
      email:       "fatuma.ali@example.com",
      role:        "provider",
      status:      "active",
      isActive:    true,
      location:    "Zanzibar, TZ",
      skills:      ["interior design", "3D rendering"],
      bio:         "Interior designer with a passion for contemporary African aesthetics.",
      createdAt:   TS(20),
    },
  },
  // Clients
  {
    id: "client_001",
    data: {
      displayName: "Michael Otieno",
      email:       "michael.otieno@example.com",
      role:        "client",
      status:      "active",
      isActive:    true,
      location:    "Lagos, NG",
      createdAt:   TS(55),
    },
  },
  {
    id: "client_002",
    data: {
      displayName: "Daniel Mwangi",
      email:       "daniel.mwangi@example.com",
      role:        "client",
      status:      "active",
      isActive:    true,
      location:    "Kisumu, KE",
      createdAt:   TS(40),
    },
  },
  {
    id: "client_003",
    data: {
      displayName: "Brian Kipchoge",
      email:       "brian.kipchoge@example.com",
      role:        "client",
      status:      "active",
      isActive:    true,
      location:    "Eldoret, KE",
      createdAt:   TS(22),
    },
  },
  {
    id: "client_004",
    data: {
      displayName: "Sarah Kamau",
      email:       "sarah.kamau@example.com",
      role:        "client",
      status:      "active",
      isActive:    true,
      location:    "Nairobi, KE",
      createdAt:   TS(10),
    },
  },
];

const SERVICES = [
  {
    id: "svc_001",
    data: {
      title:        "Modern Web Development",
      description:  "Full-stack web apps with React, Node.js, and Firebase. Responsive, fast, and scalable.",
      providerId:   "provider_001",
      providerName: "Jane Wanjiku",
      category:     "digital",
      price:        199,
      currency:     "USD",
      status:       "approved",
      isActive:     true,
      rating:       4.8,
      reviewCount:  12,
      createdAt:    TS(55),
    },
  },
  {
    id: "svc_002",
    data: {
      title:        "Brand Photography Package",
      description:  "Professional brand photography – headshots, product shots, and marketing imagery.",
      providerId:   "provider_002",
      providerName: "Amina Hassan",
      category:     "physical",
      price:        120,
      currency:     "USD",
      status:       "approved",
      isActive:     true,
      rating:       4.9,
      reviewCount:  8,
      createdAt:    TS(40),
    },
  },
  {
    id: "svc_003",
    data: {
      title:        "Personal Training – 10 Sessions",
      description:  "Customised fitness plan with nutrition guidance. In-person or virtual.",
      providerId:   "provider_003",
      providerName: "Chris Mwangi",
      category:     "physical",
      price:        60,
      currency:     "USD",
      status:       "pending",
      isActive:     false,
      rating:       0,
      reviewCount:  0,
      createdAt:    TS(4),
    },
  },
  {
    id: "svc_004",
    data: {
      title:        "African Hair Braiding",
      description:  "Box braids, cornrows, Senegalese twists, and more. Mobile service available.",
      providerId:   "provider_004",
      providerName: "Grace Njeri",
      category:     "physical",
      price:        1500,
      currency:     "KES",
      status:       "pending",
      isActive:     false,
      rating:       0,
      reviewCount:  0,
      createdAt:    TS(2),
    },
  },
  {
    id: "svc_005",
    data: {
      title:        "Cybersecurity Audit",
      description:  "Comprehensive security assessment for startups and SMEs.",
      providerId:   "provider_005",
      providerName: "David Kim",
      category:     "digital",
      price:        350,
      currency:     "USD",
      status:       "rejected",
      isActive:     false,
      rejectionReason: "Provider account suspended pending review.",
      rating:       0,
      reviewCount:  0,
      createdAt:    TS(25),
    },
  },
  {
    id: "svc_006",
    data: {
      title:        "Virtual Interior Design Consultation",
      description:  "3D renders and mood boards for residential and commercial spaces.",
      providerId:   "provider_006",
      providerName: "Fatuma Ali",
      category:     "digital",
      price:        150,
      currency:     "USD",
      status:       "approved",
      isActive:     true,
      rating:       4.7,
      reviewCount:  5,
      createdAt:    TS(15),
    },
  },
  {
    id: "svc_007",
    data: {
      title:        "UI/UX Design Sprint",
      description:  "5-day design sprint – wireframes, prototypes, and usability testing.",
      providerId:   "provider_001",
      providerName: "Jane Wanjiku",
      category:     "digital",
      price:        299,
      currency:     "USD",
      status:       "approved",
      isActive:     true,
      rating:       4.6,
      reviewCount:  3,
      createdAt:    TS(10),
    },
  },
];

const BOOKINGS = [
  {
    id: "bk_001",
    data: {
      clientId:     "client_001",
      clientName:   "Michael Otieno",
      providerId:   "provider_001",
      providerName: "Jane Wanjiku",
      serviceId:    "svc_001",
      serviceName:  "Modern Web Development",
      status:       "completed",
      amount:       199,
      currency:     "USD",
      notes:        "Need an e-commerce site for my clothing brand.",
      createdAt:    TS(50),
    },
  },
  {
    id: "bk_002",
    data: {
      clientId:     "client_002",
      clientName:   "Daniel Mwangi",
      providerId:   "provider_002",
      providerName: "Amina Hassan",
      serviceId:    "svc_002",
      serviceName:  "Brand Photography Package",
      status:       "completed",
      amount:       120,
      currency:     "USD",
      notes:        "Product photos for my business.",
      createdAt:    TS(38),
    },
  },
  {
    id: "bk_003",
    data: {
      clientId:     "client_003",
      clientName:   "Brian Kipchoge",
      providerId:   "provider_001",
      providerName: "Jane Wanjiku",
      serviceId:    "svc_007",
      serviceName:  "UI/UX Design Sprint",
      status:       "accepted",
      amount:       299,
      currency:     "USD",
      notes:        "Mobile app redesign.",
      createdAt:    TS(8),
    },
  },
  {
    id: "bk_004",
    data: {
      clientId:     "client_004",
      clientName:   "Sarah Kamau",
      providerId:   "provider_006",
      providerName: "Fatuma Ali",
      serviceId:    "svc_006",
      serviceName:  "Virtual Interior Design Consultation",
      status:       "pending",
      amount:       150,
      currency:     "USD",
      notes:        "3-bedroom apartment redesign.",
      createdAt:    TS(2),
    },
  },
  {
    id: "bk_005",
    data: {
      clientId:     "client_001",
      clientName:   "Michael Otieno",
      providerId:   "provider_002",
      providerName: "Amina Hassan",
      serviceId:    "svc_002",
      serviceName:  "Brand Photography Package",
      status:       "declined",
      amount:       120,
      currency:     "USD",
      notes:        "Provider unavailable on requested dates.",
      createdAt:    TS(20),
    },
  },
];

const PAYMENTS = [
  {
    id: "TXN-8820",
    data: {
      bookingId:   "bk_001",
      clientId:    "client_001",
      clientName:  "Michael Otieno",
      providerId:  "provider_001",
      serviceId:   "svc_001",
      serviceName: "Modern Web Development",
      amount:      199,
      currency:    "USD",
      method:      "card",
      status:      "completed",
      mpesaRef:    null,
      createdAt:   TS(49),
    },
  },
  {
    id: "TXN-8819",
    data: {
      bookingId:   "bk_002",
      clientId:    "client_002",
      clientName:  "Daniel Mwangi",
      providerId:  "provider_002",
      serviceId:   "svc_002",
      serviceName: "Brand Photography Package",
      amount:      120,
      currency:    "USD",
      method:      "card",
      status:      "disputed",
      mpesaRef:    null,
      createdAt:   TS(37),
    },
  },
  {
    id: "TXN-8818",
    data: {
      bookingId:   "bk_003",
      clientId:    "client_003",
      clientName:  "Brian Kipchoge",
      providerId:  "provider_001",
      serviceId:   "svc_007",
      serviceName: "UI/UX Design Sprint",
      amount:      299,
      currency:    "USD",
      method:      "mpesa",
      status:      "completed",
      mpesaRef:    "QHJ73KLP2X",
      createdAt:   TS(7),
    },
  },
  {
    id: "TXN-8817",
    data: {
      bookingId:   null,
      clientId:    "client_002",
      clientName:  "Daniel Mwangi",
      providerId:  "provider_006",
      serviceId:   "svc_006",
      serviceName: "Virtual Interior Design Consultation",
      amount:      150,
      currency:    "USD",
      method:      "card",
      status:      "flagged",
      mpesaRef:    null,
      createdAt:   TS(5),
    },
  },
  {
    id: "TXN-8816",
    data: {
      bookingId:   null,
      clientId:    "client_004",
      clientName:  "Sarah Kamau",
      providerId:  "provider_006",
      serviceId:   "svc_006",
      serviceName: "Virtual Interior Design Consultation",
      amount:      150,
      currency:    "USD",
      method:      "mpesa",
      status:      "pending",
      mpesaRef:    "MPESA87234",
      createdAt:   TS(1),
    },
  },
  {
    id: "TXN-8815",
    data: {
      bookingId:   null,
      clientId:    "client_001",
      clientName:  "Michael Otieno",
      providerId:  "provider_002",
      serviceId:   "svc_002",
      serviceName: "Brand Photography Package",
      amount:      120,
      currency:    "USD",
      method:      "card",
      status:      "refunded",
      mpesaRef:    null,
      createdAt:   TS(19),
    },
  },
  {
    id: "TXN-8814",
    data: {
      bookingId:   null,
      clientId:    "client_003",
      clientName:  "Brian Kipchoge",
      providerId:  "provider_001",
      serviceId:   "svc_001",
      serviceName: "Modern Web Development",
      amount:      199,
      currency:    "USD",
      method:      "card",
      status:      "completed",
      mpesaRef:    null,
      createdAt:   TS(15),
    },
  },
  {
    id: "TXN-8813",
    data: {
      bookingId:   null,
      clientId:    "client_004",
      clientName:  "Sarah Kamau",
      providerId:  "provider_002",
      serviceId:   "svc_002",
      serviceName: "Brand Photography Package",
      amount:      14950, // KES
      currency:    "KES",
      method:      "mpesa",
      status:      "completed",
      mpesaRef:    "NQA23KLP9Z",
      createdAt:   TS(12),
    },
  },
  {
    id: "TXN-8812",
    data: {
      bookingId:   null,
      clientId:    "client_002",
      clientName:  "Daniel Mwangi",
      providerId:  "provider_002",
      serviceId:   "svc_002",
      serviceName: "Brand Photography Package",
      amount:      120,
      currency:    "USD",
      method:      "card",
      status:      "disputed",
      mpesaRef:    null,
      createdAt:   TS(9),
    },
  },
  {
    id: "TXN-8811",
    data: {
      bookingId:   null,
      clientId:    "client_001",
      clientName:  "Michael Otieno",
      providerId:  "provider_006",
      serviceId:   "svc_006",
      serviceName: "Virtual Interior Design Consultation",
      amount:      150,
      currency:    "USD",
      method:      "card",
      status:      "completed",
      mpesaRef:    null,
      createdAt:   TS(6),
    },
  },
];

const ADMIN_LOGS = [
  {
    id: "log_001",
    data: {
      adminName: "Kelvin Admin",
      adminRole: "admin",
      action:    "approved",
      target:    "Provider: Jane Wanjiku",
      createdAt: TS(59),
    },
  },
  {
    id: "log_002",
    data: {
      adminName: "Kelvin Admin",
      adminRole: "admin",
      action:    "approved",
      target:    "Service: Modern Web Development",
      createdAt: TS(54),
    },
  },
  {
    id: "log_003",
    data: {
      adminName: "Kelvin Admin",
      adminRole: "admin",
      action:    "approved",
      target:    "Provider: Amina Hassan",
      createdAt: TS(44),
    },
  },
  {
    id: "log_004",
    data: {
      adminName: "Kelvin Admin",
      adminRole: "admin",
      action:    "approved",
      target:    "Service: Brand Photography Package",
      createdAt: TS(39),
    },
  },
  {
    id: "log_005",
    data: {
      adminName: "Kelvin Admin",
      adminRole: "admin",
      action:    "suspended",
      target:    "Provider: David Kim",
      createdAt: TS(29),
    },
  },
  {
    id: "log_006",
    data: {
      adminName: "Kelvin Admin",
      adminRole: "admin",
      action:    "rejected",
      target:    "Service: Cybersecurity Audit",
      createdAt: TS(24),
    },
  },
  {
    id: "log_007",
    data: {
      adminName: "Kelvin Admin",
      adminRole: "admin",
      action:    "approved",
      target:    "Provider: Fatuma Ali",
      createdAt: TS(19),
    },
  },
  {
    id: "log_008",
    data: {
      adminName: "Kelvin Admin",
      adminRole: "admin",
      action:    "refunded",
      target:    "Txn #TXN-8815 ($120)",
      createdAt: TS(18),
    },
  },
  {
    id: "log_009",
    data: {
      adminName: "Kelvin Admin",
      adminRole: "admin",
      action:    "flagged",
      target:    "Txn #TXN-8817 ($150)",
      createdAt: TS(4),
    },
  },
  {
    id: "log_010",
    data: {
      adminName: "Kelvin Admin",
      adminRole: "admin",
      action:    "approved",
      target:    "Service: Virtual Interior Design Consultation",
      createdAt: TS(14),
    },
  },
];

const REVIEWS = [
  {
    id: "rev_001",
    data: {
      bookingId:   "bk_001",
      clientId:    "client_001",
      clientName:  "Michael Otieno",
      providerId:  "provider_001",
      serviceId:   "svc_001",
      serviceName: "Modern Web Development",
      rating:      5,
      comment:     "Excellent work! Delivered ahead of schedule with pristine code quality.",
      createdAt:   TS(45),
    },
  },
  {
    id: "rev_002",
    data: {
      bookingId:   "bk_002",
      clientId:    "client_002",
      clientName:  "Daniel Mwangi",
      providerId:  "provider_002",
      serviceId:   "svc_002",
      serviceName: "Brand Photography Package",
      rating:      4,
      comment:     "Great photos. Communication could have been better.",
      createdAt:   TS(35),
    },
  },
  {
    id: "rev_003",
    data: {
      bookingId:   null,
      clientId:    "client_003",
      clientName:  "Brian Kipchoge",
      providerId:  "provider_001",
      serviceId:   "svc_001",
      serviceName: "Modern Web Development",
      rating:      5,
      comment:     "Really impressed. Will hire again.",
      createdAt:   TS(14),
    },
  },
];

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🌱  PEDY Firestore Seeder\n");

  if (CLEAR) {
    console.log("Clearing collections…");
    await Promise.all([
      clearCollection("users"),
      clearCollection("services"),
      clearCollection("bookings"),
      clearCollection("payments"),
      clearCollection("reviews"),
      clearCollection("adminLogs"),
    ]);
    console.log();
  }

  console.log("Writing seed data…");
  await batchWrite("users",      USERS);
  await batchWrite("services",   SERVICES);
  await batchWrite("bookings",   BOOKINGS);
  await batchWrite("payments",   PAYMENTS);
  await batchWrite("reviews",    REVIEWS);
  await batchWrite("adminLogs",  ADMIN_LOGS);

  console.log(`
✔  Seed complete!

Summary
───────
  Users    : ${USERS.length}    (${USERS.filter(u=>u.data.role==="provider").length} providers, ${USERS.filter(u=>u.data.role==="client").length} clients, 1 admin)
  Services : ${SERVICES.length}    (${SERVICES.filter(s=>s.data.status==="approved").length} approved, ${SERVICES.filter(s=>s.data.status==="pending").length} pending, 1 rejected)
  Bookings : ${BOOKINGS.length}
  Payments : ${PAYMENTS.length}
  Reviews  : ${REVIEWS.length}
  Activity : ${ADMIN_LOGS.length} log entries

⚠  Admin login note
───────────────────
  To log into the admin panel you need a real Firebase Auth account
  with the SAME uid as a Firestore user doc that has role = "admin".

  Steps:
  1. Create a Firebase Auth user in Firebase Console (Authentication tab)
     with email: admin@pedy.app
  2. Copy the UID that Firebase assigns.
  3. In Firestore → users collection → document admin_001
     change the document ID to match that UID.
  4. Log in at the admin panel with admin@pedy.app.
`);

  process.exit(0);
}

main().catch((err) => {
  console.error("❌  Seed failed:", err.message);
  process.exit(1);
});
