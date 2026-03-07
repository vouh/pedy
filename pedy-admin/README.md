# pedy-admin

Separate admin panel for the PEDY platform — distinct from the user-facing `Front end/` and from `pedy-backend`.

## Architecture

```
pedy-admin/
├── backend/          ← Express REST API  (port 4000)
│   ├── config/
│   │   └── firebase.js         # Firebase Admin SDK init (shared with pedy-backend)
│   ├── middleware/
│   │   └── rbac.js             # Firebase token verification + RBAC
│   ├── routes/
│   │   ├── auth.js             # POST /verify, GET /me
│   │   ├── users.js            # CRUD on Firestore users collection
│   │   ├── services.js         # CRUD on Firestore services collection
│   │   ├── payments.js         # CRUD on Firestore payments collection
│   │   └── analytics.js        # GET /  – live dashboard stats
│   ├── server.js
│   ├── .env.example
│   └── package.json
└── frontend/         ← Plain HTML + Tailwind (open via Live Server)
    ├── index.html    # Login page (Firebase Auth)
    ├── dashboard.html
    ├── users.html
    ├── services.html
    ├── payments.html
    └── shared.js     # Auth guard, API fetch helper, sidebar/topbar builder
```

## Authentication Flow

1. Admin opens `frontend/index.html` and signs in with their **Firebase email + password**.
2. The page gets their Firebase **ID token** and sends it to `POST /api/admin/auth/verify`.
3. The backend verifies the token and looks up the admin's record in the Firestore **`admins`** collection.
4. The admin's `{ uid, name, email, role }` and the ID token are stored in `sessionStorage`.
5. Every subsequent API call sends `Authorization: Bearer <idToken>`.

## Admin Roles (RBAC)

| Role | Users | Services | Payments |
|------|-------|----------|----------|
| `super_admin` | read/write/suspend/ban | read/write/approve/reject/remove | read/refund/resolve/flag/export |
| `content_moderator` | read/write/suspend | read/write/approve/reject/remove | read only |
| `payment_manager` | read only | read only | read/refund/resolve/flag/export |

## Creating an Admin Account

1. Create the Firebase Auth user (via Firebase Console or the PEDY sign-up page).
2. In Firestore, manually create the document:
   ```
   Collection: admins
   Document ID: <Firebase UID>
   Fields:
     uid:   "<same Firebase UID>"
     name:  "Super Admin"
     email: "admin@yourorg.com"
     role:  "super_admin"   ← or "content_moderator" / "payment_manager"
   ```
3. The user can now log in via `frontend/index.html`.

## Quick Start

### 1. Shared Firebase service account

The admin backend shares the same Firebase project as `pedy-backend`. Point `FIREBASE_SERVICE_ACCOUNT_PATH` to the same `service-account.json`:

```bash
cd pedy-admin/backend
cp .env.example .env
# Edit .env if your service-account.json is in a non-default location
```

### 2. Install dependencies

```bash
cd pedy-admin/backend
npm install
```

### 3. Run the server

```bash
npm run dev   # development (nodemon, port 4000)
npm start     # production
```

### 4. Open the frontend

Open `pedy-admin/frontend/index.html` via Live Server (VS Code) or any static file server.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/admin/auth/verify` | — | Verify Firebase ID token, return admin info |
| GET | `/api/admin/auth/me` | ✓ | Current admin's info |
| GET | `/api/admin/users` | ✓ | List users (Firestore) |
| PATCH | `/api/admin/users/:id/approve` | ✓ | Approve a provider |
| PATCH | `/api/admin/users/:id/suspend` | ✓ | Suspend a user |
| PATCH | `/api/admin/users/:id/reinstate` | ✓ | Reinstate a user |
| DELETE | `/api/admin/users/:id` | ✓ (super_admin) | Permanently ban |
| GET | `/api/admin/services` | ✓ | List services (Firestore) |
| PATCH | `/api/admin/services/:id/approve` | ✓ | Approve listing |
| PATCH | `/api/admin/services/:id/reject` | ✓ | Reject listing |
| DELETE | `/api/admin/services/:id` | ✓ | Remove listing |
| GET | `/api/admin/payments` | ✓ | List payments (Firestore) |
| PATCH | `/api/admin/payments/:id/refund` | ✓ | Issue refund |
| PATCH | `/api/admin/payments/:id/resolve` | ✓ | Resolve dispute |
| PATCH | `/api/admin/payments/:id/flag` | ✓ | Flag transaction |
| GET | `/api/admin/payments/export/csv` | ✓ | Export CSV |
| GET | `/api/admin/analytics` | ✓ | Live dashboard stats |
| GET | `/api/health` | — | Health check |
