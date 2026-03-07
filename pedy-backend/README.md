# pedy-backend

Node.js / Express REST API for the PEDY Global Service Marketplace.

## Tech Stack

- **Runtime:** Node.js ≥ 16
- **Framework:** Express.js 4
- **Database:** Firebase Firestore (via Firebase Admin SDK)
- **Auth:** Firebase Authentication (ID-token verification)
- **Payments:** M-Pesa Daraja API (STK Push)
- **Security:** Helmet, CORS, express-rate-limit, Morgan

## Project Structure

```
pedy-backend/
├── src/
│   ├── config/
│   │   ├── firebase.js        # Firebase Admin SDK init
│   │   └── mpesa.js           # M-Pesa Daraja helpers
│   ├── middleware/
│   │   └── auth.js            # Token verification, role guards
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── services.controller.js
│   │   ├── providers.controller.js
│   │   ├── bookings.controller.js
│   │   ├── payments.controller.js
│   │   └── admin.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── services.routes.js
│   │   ├── providers.routes.js
│   │   ├── bookings.routes.js
│   │   ├── payments.routes.js
│   │   └── admin.routes.js
│   └── index.js               # Express app entry point
├── .env                        # Secrets (gitignored)
├── .env.example                # Template
├── service-account.json        # Firebase service account key (gitignored)
└── package.json
```

## Quick Start

### 1. Install dependencies
```bash
cd pedy-backend
npm install
```

### 2. Firebase Service Account
1. Go to **Firebase Console → Project Settings → Service Accounts**
2. Click **Generate new private key** → download the JSON
3. Save it as `pedy-backend/service-account.json` (gitignored)

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env and fill in your M-Pesa credentials and CORS origins
```

### 4. Run the server
```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:5000`.

## API Endpoints

### Authentication
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Create account + Firestore profile |
| POST | `/api/auth/login` | — | Exchange Firebase UID for custom token |
| GET | `/api/auth/me` | ✅ | Get current user profile |

### Services
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/services` | — | List/search services |
| GET | `/api/services/:id` | — | Get single service |
| POST | `/api/services` | Provider | Create service |
| PUT | `/api/services/:id` | Provider | Update own service |
| DELETE | `/api/services/:id` | Provider | Soft-delete service |

### Providers
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/providers` | — | List providers |
| GET | `/api/providers/:id` | — | Provider profile + services + reviews |
| PUT | `/api/providers/:id` | ✅ | Update own profile |

### Bookings
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/bookings` | ✅ | Create booking |
| GET | `/api/bookings?role=client\|provider` | ✅ | List bookings |
| GET | `/api/bookings/:id` | ✅ | Get booking |
| PUT | `/api/bookings/:id/status` | ✅ | Update status |

### Payments (M-Pesa)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/payments/stk-push` | ✅ | Initiate STK Push |
| POST | `/api/payments/callback` | — | Safaricom callback URL |
| GET | `/api/payments/status/:checkoutId` | ✅ | Query payment status |

### Admin (requires `role: "admin"` in Firestore)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/analytics` | Platform-wide stats |
| GET | `/api/admin/users` | List all users |
| PUT | `/api/admin/users/:uid/status` | Activate/deactivate user |
| PUT | `/api/admin/users/:uid/role` | Change user role |
| GET | `/api/admin/services` | List all services |
| PUT | `/api/admin/services/:id/status` | Activate/deactivate service |
| GET | `/api/admin/bookings` | List all bookings |
| GET | `/api/admin/payments` | List all payments |

## Authentication Flow

All protected routes require an `Authorization: Bearer <Firebase ID Token>` header.

1. Client signs in via Firebase Auth (client SDK)
2. Client calls `user.getIdToken()` to obtain the ID token
3. Include the token in every request to protected endpoints

## M-Pesa Setup (Daraja)

1. Register at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Create an app → get **Consumer Key** and **Consumer Secret**
3. Get your **Shortcode** and **Passkey** from the Lipa Na M-Pesa section
4. For sandbox, use the test credentials provided by Safaricom
5. Set `MPESA_CALLBACK_BASE_URL` to a publicly accessible URL (use [ngrok](https://ngrok.com) in development)

## Health Check

```
GET /health
→ { "status": "ok", "service": "pedy-backend", "timestamp": "..." }
```
