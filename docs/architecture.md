# Technical Architecture Document
## Smart India Hackathon 2026 – Problem Statement ID: 26032
### Smart Procurement Platform: Modular Monolith System Architecture

---

## 1. Architecture Overview

The **Smart Procurement Platform** is engineered as a **Modular Monolith** application to strike an optimal balance between architectural simplicity, high developer velocity, and robust performance during high-throughput government procurement cycles.

The system is decoupled into two primary tiers:
1. **Frontend Tier:** A reactive Single Page Application (SPA) built with React 18, Vite, and Tailwind CSS, featuring role-scoped routing, offline-resilient state management, and real-time Socket.IO subscriptions.
2. **Backend Tier:** A Node.js and Express RESTful API server coupled with a real-time Socket.IO engine and MongoDB database, enforcing server-side business rules, queue state transitions, and audit trails.

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|  +-----------------------+  +------------------------+  +----------------------+  |
|  |  Farmer Mobile App    |  | Staff Counter Tablet   |  | Admin Command Center |  |
|  |  (React/Tailwind/i18n)|  | (React/Tailwind/Socket)|  | (React/Recharts/Maps)|  |
|  +-----------+-----------+  +-----------+------------+  +----------+-----------+  |
+--------------|--------------------------|--------------------------|--------------+
               | HTTPS / REST             | Socket.IO Websocket      | HTTPS / REST
               v                          v                          v
+-----------------------------------------------------------------------------------+
|                                 API GATEWAY LAYER                                 |
|  [ CORS | Helmet | Express-Rate-Limit | Morgan Logger | JWT Auth Middleware ]    |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                              BUSINESS LOGIC LAYER                                 |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|  | Booking Controller |  |  Queue Controller  |  |  Procurement Controller     |  |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|  | Recommendation Engine | Payment Tracker    |  |  Notification Service       |  |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                                 DATA ACCESS LAYER                                 |
|  [ Mongoose ODM | MongoDB Schemas | 2dsphere Geospatial Index | Compound Indexes ] |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                                  DATABASE LAYER                                   |
|                        MongoDB Document Store (Cluster / Local)                   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 | Declarative component model, efficient DOM rendering |
| **Build System** | Vite 5 | Instant HMR, lightning-fast bundling |
| **Styling** | Tailwind CSS 3 | Utility-first CSS, exact design token enforcement |
| **Routing** | React Router DOM 6 | Client-side routing with protected layout guards |
| **Icons** | Lucide React | Clean, high-contrast SVG icons for accessibility |
| **Map Rendering** | Leaflet + React-Leaflet | Open-source map layer with OSM tiles (no API keys required) |
| **Internationalization** | i18next + react-i18next | Declarative Hindi/English translation loading |
| **Backend Runtime** | Node.js (v18+ LTS) | High event-loop concurrency for real-time web sockets |
| **Web Framework** | Express.js 4 | Unopinionated, robust REST API routing |
| **Database** | MongoDB 6.0+ | Flexible JSON-document schema for dynamic procurement records |
| **Object Modeling** | Mongoose 8.0+ | Strict schema validation and middleware hooks |
| **Real-Time Pipeline**| Socket.IO 4 | Reliable bidirectional WebSocket event streaming |
| **Authentication** | JWT (`jsonwebtoken`) + `bcryptjs` | Stateless authentication & secure salted password hashing |

---

## 3. Repository Structure

```
smart-procurement-platform/
├── frontend/                     # React Single Page Application
│   ├── public/                   # Static assets, map markers, favicons
│   ├── src/
│   │   ├── assets/               # Branding assets & imagery
│   │   ├── components/           # Reusable UI components
│   │   │   ├── common/           # Buttons, Modal, Toast, Card, Badge
│   │   │   ├── farmer/           # TokenCard, CentreCard, RecommendationBanner
│   │   │   ├── staff/            # QueueCaller, MoistureForm, WeightSlip
│   │   │   └── admin/            # LoadChart, StateMap, AuditTable
│   │   ├── context/              # AuthContext, LanguageContext, SocketContext
│   │   ├── hooks/                # useAuth, useQueue, useSocket, useGeolocation
│   │   ├── i18n/                 # Translation JSON files (en.json, hi.json)
│   │   ├── pages/                # Page views per user role
│   │   │   ├── auth/             # Login, Register
│   │   │   ├── farmer/           # Home, FindCentres, BookSlot, LiveQueue, Payments
│   │   │   ├── staff/            # StaffDashboard, QueueManager, ProcurementLog
│   │   │   └── admin/            # CommandCenter, CentreAnalytics, SystemAudit
│   │   ├── services/             # API client instances (Axios/Fetch wrapper)
│   │   ├── utils/                # Date formatters, math scoring helpers
│   │   ├── App.jsx               # Main Router setup
│   │   ├── main.jsx              # Entry point
│   │   └── index.css             # Tailwind imports & custom government theme tokens
│   ├── package.json
│   └── vite.config.js
│
├── backend/                      # Node.js + Express + Socket.IO Server
│   ├── src/
│   │   ├── config/               # DB connection, JWT secrets, constants
│   │   ├── controllers/          # Request handlers
│   │   │   ├── authController.js
│   │   │   ├── centreController.js
│   │   │   ├── slotController.js
│   │   │   ├── bookingController.js
│   │   │   ├── queueController.js
│   │   │   ├── procurementController.js
│   │   │   ├── paymentController.js
│   │   │   ├── notificationController.js
│   │   │   └── adminController.js
│   │   ├── middleware/           # authMiddleware, roleMiddleware, errorHandler
│   │   ├── models/               # Mongoose Schemas (User, Centre, Booking, etc.)
│   │   ├── routes/               # Express route definitions
│   │   ├── services/             # Core business logic & score calculations
│   │   │   ├── recommendationService.js
│   │   │   ├── queueEngine.js
│   │   │   └── notificationService.js
│   │   ├── socket/               # Socket.IO handlers & room channels
│   │   ├── utils/                # Token generators, distance formula
│   │   └── server.js             # Express app & HTTP server entrypoint
│   ├── seed/                     # Demo data seed scripts
│   ├── package.json
│   └── .env.example
│
├── docs/                         # Project Documentation Source of Truth
│   ├── PRD.md
│   └── architecture.md
│
├── README.md
└── .gitignore
```

---

## 4. Frontend Architecture

The frontend follows a **Role-Scoped Component Tree** design:
* **Context Providers:**
  * `AuthContext`: Manages JWT persistence, current user object, role (`FARMER`, `STAFF`, `ADMIN`), and logout procedures.
  * `LanguageContext`: Wraps `i18next` for instant language toggling (`en` $\leftrightarrow$ `hi`).
  * `SocketContext`: Maintains singleton Socket.IO connection, auto-subscribing to user/centre channels.
* **Design Tokens (Government Palette):**
  * `bg-warm-ivory` (`#FAF8F5`)
  * `text-dark-neutral` (`#22252A`)
  * `bg-forest-green` (`#1B4D3E`)
  * `bg-wheat-accent` (`#D4A373`)
  * `border-subtle-gray` (`#E5E7EB`)

---

## 5. Backend Architecture

The backend implements a clean **Controller-Service-Repository** pattern:
* **Controllers:** Handle HTTP request validation, extract user payload from JWT, invoke service functions, and send standardized JSON responses.
* **Services:** Contain pure business logic (e.g., scoring algorithm, queue state transition checks, slot capacity verification).
* **Models (Repositories):** Direct Mongoose schema interfaces for database persistence.

---

## 6. Authentication Architecture

* **Authentication Protocol:** JSON Web Tokens (JWT) signed with `HS256`.
* **Payload Structure:**
  ```json
  {
    "userId": "66d8e20f1a2b3c4d5e6f7a8b",
    "role": "FARMER",
    "phone": "9876543210",
    "iat": 1725200000,
    "exp": 1725286400
  }
  ```
* **Security Rules:** Tokens expire in 24 hours. Passwords hashed using `bcryptjs` with salt round of 10.

---

## 7. Role-Based Access Control (RBAC)

RBAC is enforced via Express middleware:
```javascript
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient role permissions' }
      });
    }
    next();
  };
};
```

---

## 8. API Architecture

All endpoints follow RESTful conventions returning a standard JSON payload format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "meta": { "page": 1, "total": 100 }
}
```

---

## 9. MongoDB Architecture

MongoDB schemas prioritize data integrity and query efficiency through explicit references:

```
[User] (role: FARMER)
   └── [FarmerProfile] (landSize, village, cropTypes)

[ProcurementCentre] (name, location, capacityQuintalsPerDay)
   ├── [Slot] (date, timeWindow, maxFarmers, bookedCount)
   └── [QueueEntry] (tokenNumber, state, arrivalTime)

[Booking] (farmerId, centreId, slotId, status)
   └── [Procurement] (netWeightQuintals, moisturePercentage, mspRate)
        └── [PaymentStatus] (stage, amountPayable, transactionRef)
```

---

## 10. Data Models & 11. Suggested Collections

### 1. `User` Collection
```javascript
{
  _id: ObjectId,
  phone: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['FARMER', 'STAFF', 'ADMIN'], required: true },
  fullName: { type: String, required: true },
  languagePreference: { type: String, enum: ['en', 'hi'], default: 'hi' },
  isActive: { type: Boolean, default: true },
  createdAt: Date,
  updatedAt: Date
}
```

### 2. `FarmerProfile` Collection
```javascript
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: 'User', required: true, unique: true },
  farmerIdNumber: { type: String, unique: true }, // e.g. FRM-MP-SEH-0042
  maskedAadhaar: String, // e.g. XXXX-XXXX-1234
  district: String,
  state: String,
  villageName: String,
  pincode: String,
  landholdingAcreage: Number,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  }
}
```

### 3. `ProcurementCentre` Collection
```javascript
{
  _id: ObjectId,
  centreCode: { type: String, required: true, unique: true }, // e.g. SEH01
  name: { type: String, required: true }, // e.g. Krishi Seva Procurement Centre - Sehore
  district: String,
  state: String,
  address: String,
  operatingHours: { open: String, close: String },
  dailyCapacityQuintals: Number,
  maxConcurrentFarmers: Number,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  },
  assignedStaffIds: [{ type: ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true }
}
```

### 4. `Slot` Collection
```javascript
{
  _id: ObjectId,
  centreId: { type: ObjectId, ref: 'ProcurementCentre', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  timeWindow: { type: String, required: true }, // e.g. "09:00 - 10:00"
  maxCapacityQuintals: Number,
  bookedCapacityQuintals: { type: Number, default: 0 },
  maxFarmersAllowed: Number,
  bookedFarmersCount: { type: Number, default: 0 },
  isAvailable: { type: Boolean, default: true }
}
```

### 5. `Booking` Collection
```javascript
{
  _id: ObjectId,
  bookingReference: { type: String, required: true, unique: true }, // BKG-20261015-9982
  tokenNumber: { type: String, required: true }, // TOK-SEH01-20261015-042
  farmerId: { type: ObjectId, ref: 'User', required: true },
  centreId: { type: ObjectId, ref: 'ProcurementCentre', required: true },
  slotId: { type: ObjectId, ref: 'Slot', required: true },
  cropType: { type: String, enum: ['Wheat', 'Paddy', 'Pulses', 'Mustard'], required: true },
  estimatedQuantityQuintals: { type: Number, required: true },
  bookingStatus: { type: String, enum: ['CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'], default: 'CONFIRMED' },
  createdAt: Date
}
```

### 6. `QueueEntry` Collection
```javascript
{
  _id: ObjectId,
  bookingId: { type: ObjectId, ref: 'Booking', required: true, unique: true },
  centreId: { type: ObjectId, ref: 'ProcurementCentre', required: true },
  tokenNumber: String,
  sequenceNumber: Number,
  state: { 
    type: String, 
    enum: ['WAITING', 'CALLED', 'ARRIVED', 'VERIFICATION', 'WEIGHING', 'COMPLETED', 'CANCELLED', 'NO_SHOW'], 
    default: 'WAITING' 
  },
  calledAt: Date,
  arrivedAt: Date,
  completedAt: Date
}
```

### 7. `Procurement` Collection
```javascript
{
  _id: ObjectId,
  bookingId: { type: ObjectId, ref: 'Booking', required: true, unique: true },
  farmerId: { type: ObjectId, ref: 'User', required: true },
  centreId: { type: ObjectId, ref: 'ProcurementCentre', required: true },
  verifiedByStaffId: { type: ObjectId, ref: 'User' },
  qualityGrade: { type: String, enum: ['Grade A', 'Grade B', 'Rejected'] },
  moisturePercentage: Number,
  grossWeightQuintals: Number,
  tareWeightQuintals: Number,
  netWeightQuintals: Number,
  mspRatePerQuintal: Number,
  totalAmountPayable: Number,
  receiptSerialNumber: String,
  completedAt: Date
}
```

### 8. `PaymentStatus` Collection
```javascript
{
  _id: ObjectId,
  procurementId: { type: ObjectId, ref: 'Procurement', required: true, unique: true },
  farmerId: { type: ObjectId, ref: 'User', required: true },
  totalAmount: Number,
  currentStage: { 
    type: String, 
    enum: [
      'SLOT_CONFIRMED', 
      'ARRIVED_AT_CENTRE', 
      'VERIFICATION', 
      'WEIGHING', 
      'PROCUREMENT_COMPLETED', 
      'PAYMENT_INITIATED', 
      'PAYMENT_PROCESSING', 
      'PAID'
    ],
    default: 'SLOT_CONFIRMED'
  },
  stageHistory: [{
    stage: String,
    updatedAt: Date,
    updatedByRole: String,
    remarks: String
  }],
  updatedAt: Date
}
```

### 9. `Notification` Collection
```javascript
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['IN_APP', 'SMS', 'PUSH'] },
  title: String,
  message: String,
  isRead: { type: Boolean, default: false },
  sentAt: Date
}
```

### 10. `AuditLog` Collection
```javascript
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: 'User' },
  userRole: String,
  action: String, // e.g. QUEUE_STATE_OVERRIDE, MANUAL_SLOT_CANCEL
  entityType: String, // e.g. QueueEntry, Booking
  entityId: ObjectId,
  ipAddress: String,
  details: Object,
  timestamp: { type: Date, default: Date.now }
}
```

---

## 12. Database Indexing Strategy

* **2dsphere Geospatial Index:** `ProcurementCentre.location` and `FarmerProfile.location` for fast `$nearSphere` spatial discovery.
* **Compound Index (Slots):** `Slot.centreId + Slot.date` for instant booking window queries.
* **Compound Index (Queue):** `QueueEntry.centreId + QueueEntry.state + QueueEntry.sequenceNumber` for real-time token lookups.

---

## 13. Booking Architecture

1. **Race Condition Protection:** Mongoose atomic query `findOneAndUpdate` with condition `{ bookedFarmersCount: { $lt: maxFarmersAllowed } }`.
2. **Quota Checks:** Ensures total quantity quintals booked in a slot does not exceed centre capacity limits.

---

## 14. Queue Architecture & 15. Queue State Machine

The queue engine maintains state transitions strictly on the backend:

```
[WAITING] ──(Staff click "Call Next")──> [CALLED] ──(Staff confirm arrival)──> [ARRIVED]
    │                                       │
    ├──(Farmer cancels)                     └──(Unresponsive >30m)──> [NO_SHOW]
    v                                                                    │
[CANCELLED]                                                        (Staff Re-queue)
                                                                         │
                                                                         v
                                                                    [WAITING]

[ARRIVED] ──(Verification passed)──> [VERIFICATION] ──(Weighing done)──> [WEIGHING]
                                                                            │
                                                                   (Receipt logged)
                                                                            v
                                                                       [COMPLETED]
```

---

## 16. Real-Time Socket Architecture

```
+------------------+         +------------------+         +--------------------+
|  Farmer Client   |         |  Backend Server  |         | Staff Counter Client|
+--------+---------+         +--------+---------+         +---------+----------+
         |                            |                             |
         | ---- connect(token) -----> |                             |
         |                            | <----- connect(token) ----- |
         | ---- join("centre_123")--> |                             |
         |                            | <--- join("centre_123") --- |
         |                            |                             |
         |                            | <--- call_next_token ------ | (Staff click)
         |                            |                             |
         | <--- token_called -------- | --------------------------> | (Broadcast update)
         |    (Notification toast)    |                             |
```

---

## 17. Centre Recommendation Architecture

### Deterministic Scoring Algorithm:
$$\text{Score}(c) = \left(0.40 \times \frac{D_{\max} - d(c)}{D_{\max}}\right) + \left(0.30 \times \frac{W_{\max} - w(c)}{W_{\max}}\right) + \left(0.15 \times \frac{Q_{\max} - q(c)}{Q_{\max}}\right) + \left(0.10 \times \frac{\text{Cap}(c)}{\text{Cap}_{\max}}\right) + \left(0.05 \times S(c)\right)$$

Where:
* $d(c)$: Distance in km to centre $c$.
* $w(c)$: Estimated wait time in minutes at centre $c$.
* $q(c)$: Active waiting farmers count at centre $c$.
* $\text{Cap}(c)$: Daily throughput capacity in quintals.
* $S(c)$: Binary availability ($1$ if slot available today, $0.5$ if tomorrow).

---

## 18. Wait-Time Estimation Architecture

Estimated wait time ($W$) in minutes for a newly arriving farmer at queue position $N$:
$$W = N \times T_{\text{avg}}$$
Where $T_{\text{avg}} = 8\text{ minutes}$ (average historical verification + weighing time per farmer shipment).

---

## 19. Procurement Architecture & 20. Payment Status Architecture

* **Procurement:** Staff logs moisture test, tare/gross weights, calculates net weight and MSP total, emitting a `PROCUREMENT_COMPLETED` event.
* **Payment Pipeline:** Automated pipeline moves state from `PROCUREMENT_COMPLETED` $\rightarrow$ `PAYMENT_INITIATED` $\rightarrow$ `PAYMENT_PROCESSING` $\rightarrow$ `PAID` based on administrative batch approval triggers.

---

## 21. Notification Architecture

* Abstract interface `NotificationProvider` with implementations:
  1. `InAppNotificationService` (DB persist + Socket emit)
  2. `MockSMSNotificationService` (Console log + simulated farmer SMS drawer)

---

## 22. Maps Architecture

Leaflet.js component wrapper (`<ProcurementMap />`):
* Renders tile layer from `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`.
* Custom green wheat pin markers for centres.
* Distance matrix calculation using Haversine formula.

---

## 23. Internationalization Architecture

`react-i18next` configuration loading `locales/en/translation.json` and `locales/hi/translation.json`. Language persisted in `localStorage` and `User.languagePreference`.

---

## 24. Error Handling & 25. Validation

* **Validation:** Joi schema validation middleware on Express routes.
* **Global Error Handler:** Standardized JSON error response format:
  ```json
  {
    "success": false,
    "error": {
      "code": "SLOT_FULL",
      "message": "Selected time slot has reached maximum capacity."
    }
  }
  ```

---

## 26. Security Architecture & 27. Audit Logging

* **Security Headers:** Express `helmet()` middleware enabled.
* **CORS:** Configured explicitly for frontend domain.
* **Audit Logging:** Critical actions (queue skips, weight changes) write to `AuditLog` collection automatically via Express middleware.

---

## 28. Logging & Monitoring

* **HTTP Logging:** `morgan('combined')` for access logs.
* **Application Logging:** `winston` logger writing structured JSON to stdout and log files.

---

## 29. Seed / Demo Data Strategy

Seed script (`npm run seed`) populates realistic Indian agricultural demo data:
* **Centres:** 5 procurement centres in District Sehore & Hoshangabad, MP.
* **Users:** 10 Farmers, 3 Centre Managers, 1 State Admin.
* **Slots:** Hourly slots for today and the next 7 days.
* **Queues:** Pre-populated active queues demonstrating `WAITING`, `CALLED`, and `COMPLETED` states.

---

## 30. Testing Strategy & 31. Performance & 32. Scalability

* **Testing:** API unit tests using Jest & Supertest.
* **Performance:** Static asset gzip compression, database compound indexing.
* **Scalability:** Stateless JWT backend prepared for horizontal scaling behind Nginx load balancer.

---

## 33. Deployment Architecture

* **Containerization:** Docker & Docker Compose setup (`Dockerfile.frontend`, `Dockerfile.backend`, `docker-compose.yml`).

---

## 34. Future Government Integrations & 35. ML Architecture & 36. Voice Architecture

* Abstract adapter pattern for future e-NAM, PFMS, and PM-KISAN REST APIs.
* Interface hooks for future XGBoost wait-time prediction model and Web Speech API Hindi voice booking.

---

## 37. API Endpoint Planning

| Method | Endpoint | Description | Auth Role |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new farmer account | Public |
| `POST` | `/api/auth/login` | Login user & receive JWT token | Public |
| `GET` | `/api/auth/me` | Fetch current user profile | Authenticated |
| `GET` | `/api/centres` | List procurement centres (with distance/filter) | Authenticated |
| `GET` | `/api/centres/recommend` | Get smart recommended centres | Farmer |
| `GET` | `/api/centres/:id` | Get details of a single centre | Authenticated |
| `GET` | `/api/slots` | Get available slots for a centre & date | Authenticated |
| `POST` | `/api/bookings` | Book a procurement slot | Farmer |
| `GET` | `/api/bookings/my` | List logged-in farmer's bookings | Farmer |
| `POST` | `/api/bookings/:id/cancel` | Cancel an active booking | Farmer |
| `GET` | `/api/queue/centre/:centreId` | Get live queue state for a centre | Staff / Admin |
| `GET` | `/api/queue/my-token` | Get active token position for farmer | Farmer |
| `POST` | `/api/queue/call-next` | Advance queue state to CALLED | Staff |
| `POST` | `/api/queue/update-state` | Update queue entry state | Staff |
| `POST` | `/api/procurement/submit` | Record verification & weighing receipt | Staff |
| `GET` | `/api/payments/my-status` | Track 8-stage payment progress | Farmer |
| `POST` | `/api/payments/update-stage`| Update payment status stage | Admin / Staff |
| `GET` | `/api/notifications` | Get user notifications | Authenticated |
| `GET` | `/api/admin/dashboard` | Get state/district KPI metrics | Admin |
| `GET` | `/api/admin/audit-logs` | Fetch system audit log entries | Admin |

---

## 38. Production Environment Variables

### Backend (`backend/.env`)
```env
NODE_ENV=production
PORT=5001
FRONTEND_URL=https://your-agrinexus.vercel.app
CORS_ORIGINS=https://your-agrinexus.vercel.app
SOCKET_CORS_ORIGINS=https://your-agrinexus.vercel.app
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/agrinexus?retryWrites=true&w=majority
JWT_SECRET=replace_with_strong_random_secret_minimum_32_chars
JWT_EXPIRES_IN=24h
ADMIN_EMAIL=admin@agrinexus.gov.in
ADMIN_PASSWORD=adminpassword
GOOGLE_MAPS_API_KEY=your_server_google_maps_key
BHASHINI_API_KEY=your_bhashini_api_key
BHASHINI_USER_ID=your_bhashini_user_id
BHASHINI_PIPELINE_ID=64392f96daac500b55c543d6
BHASHINI_API_URL=https://dhruva-api.bhashini.gov.in/services/inference/pipeline
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=https://your-agrinexus-backend.onrender.com/api
VITE_SOCKET_URL=https://your-agrinexus-backend.onrender.com
VITE_GOOGLE_MAPS_API_KEY=your_restricted_google_maps_key
VITE_APP_ENV=production
```

---

## 39. Development Workflow

1. Clone repository.
2. Install root, backend, and frontend dependencies (`npm run setup`).
3. Seed database (`npm run seed`).
4. Start backend (`npm run dev --prefix backend`).
5. Start frontend (`npm run dev --prefix frontend`).

---

## 40. Phase-Wise Implementation Boundaries

* **Phase 1:** Foundation, Architecture, Authentication & Design System.
* **Phase 2:** Farmer Experience, Centre Discovery, Recommendation & Booking.
* **Phase 3:** Real-Time Queue & Procurement Centre Operations.
* **Phase 4:** Procurement Journey, Payment Status, Notifications & Maps.
* **Phase 5:** Government Command Centre, Analytics & Monitoring.
* **Phase 6:** Accessibility, Hindi, Reliability, Performance, Polish & Demo Readiness.

---

## 41. Authentication & Role Provisioning Architecture

AgriNexus enforces strict role isolation reflecting real-world public digital services:
* **Farmer Registration:** Publicly accessible via a guided 4-step wizard. Creates `role: 'FARMER'` exclusively.
* **Role Escalation Prevention:** Any attempt to pass `role: 'ADMIN'` or `role: 'CENTRE_STAFF'` to the public `POST /api/auth/register` endpoint is strictly rejected with `403 FORBIDDEN`.
* **Staff Provisioning:** Procurement Centre Staff accounts cannot be self-registered. They are provisioned through `POST /api/admin/staff` by an authenticated Government Administrator and are strictly bound to an authorized, active `assignedCentreId`.
* **Government Admin Accounts:** Admin accounts cannot be publicly registered. They are seeded for development/demo and managed through secure administrative governance.
* **Login Role Verification:** The client passes the requested access context. The backend verifies the authentic stored role and rejects mismatches (`403 ROLE_MISMATCH`).

---

## 42. Authoritative Administrative Location Hierarchy & GPS Engine

* **Structured Hierarchy:** `State` (e.g., `MP`) $\rightarrow$ `District` (e.g., `MP_SEH`) $\rightarrow$ `Village / Town` (e.g., `MP_SEH_01`).
* **Deterministic Dependencies:** Changing State resets District and Village. Changing District resets Village.
* **GPS Device Location vs. Registered Location:**
  - When browser geolocation is granted, exact GPS coordinates are used and labelled `📍 Using your current GPS location`.
  - When geolocation is unavailable or denied, the system transparently falls back to the farmer's registered administrative district coordinates and explicitly labels `🏠 Location access unavailable. Showing centres for your registered location.`
  - Zero arbitrary coordinates or pseudo-random coordinates (`Math.random()`) are permitted.

---

## 43. Procurement Centre Data Provenance & Verification Model

* **Verification Lifecycle:**
  - `VERIFIED`: Formally cross-checked against official state civil supplies corporation (MPSCSC) registries.
  - `UNVERIFIED`: Data pending administrative verification (clearly marked in UI to avoid misleading users).
  - `NEEDS_REVIEW`: Flagged for discrepancy check.
  - `INACTIVE`: Temporarily decommissioned centre.
* **Data Sources:** `GOVERNMENT_SOURCE`, `CENTRE_OPERATOR`, `ADMIN`, `DEMO`.
* **Simulation Transparency:** Demo records are explicitly tagged `dataSource: 'DEMO'` with `sourceReference: 'SIH 2026 Simulation Seed Record'` and rendered with a `Pending Verification (Demo)` tag.

---

## 44. Regional Language Registry & Strict Single-Language UI

* **Multilingual Configuration Registry (`languages.js`):**
  - **Active MVP Languages:** English (`en`, default) and Hindi (`hi`).
  - **Planned Regional Expansion:** Marathi (`mr`), Punjabi (`pa`), Gujarati (`gu`), Bengali (`bn`), Tamil (`ta`), Telugu (`te`), Kannada (`kn`), Malayalam (`ml`), Odia (`or`), Assamese (`as`).
* **Strict Single-Language Rule:** English mode is 100% English; Hindi mode is 100% natural Hindi. No bilingual parenthetical strings (`Farmer (किसान)`) are permitted.

---

## 45. Interactive Leaflet Map Architecture

* **Tile Provider:** OpenStreetMap (OSM) standard tile layers.
* **Marker Geometry:** Coordinates are strictly sourced from `ProcurementCentre.location.coordinates` (`[longitude, latitude]`).
* **Dual-Sync Interaction:** Selecting a centre card in the discovery list centers and opens the popup on the map; clicking a marker pin selects and highlights the corresponding centre card in the list.

---

## 46. System Provenance Model & SIH Environment Classification

| Component | Status | Source & Provenance | Production Requirements |
| :--- | :--- | :--- | :--- |
| **Core Workflow Engine** | IMPLEMENTED | Node.js, Express, MongoDB, Socket.IO, State Machines | Deployable |
| **Administrative Location Dataset** | REFERENCE DATA | Curated 36 States/UTs, major districts & representative localities | Live NIC / LGD API Gateway synchronization |
| **Procurement Centres** | DEMO / SIMULATION | Seeded Mandi records tagged `dataSource: 'DEMO'`, `verificationStatus: 'UNVERIFIED'` | Departmental State Civil Supplies / e-Samridhi master registry |
| **MSP Financial Engine** | IMPLEMENTED | Centralized statutory rates (Wheat: ₹2275, Paddy: ₹2300, etc.) | Annual CACP / Cabinet notification sync |
| **Banking / DBT Status** | DEMO / SIMULATION | 8-stage deterministic state tracking pipeline | PFMS / NPCI DBT payment gateway integration |
| **SMS Notifications** | DEMO / SIMULATION | Console & in-app notification ledger | CDAC / NIC SMS Gateway integration |
| **Language Localization** | IMPLEMENTED (EN/HI) | Complete English & natural Hindi bundles; regional expansion roadmap prepared | Professional regional translations for 10 planned languages |

---

## 47. Production Cloud Deployment Architecture (Vercel + Render + Atlas)

```
[Farmer / Staff / Admin Browser]
              │
              ▼ HTTPS
    ┌─────────────────────────┐
    │  Vercel Frontend (SPA)  │
    │  React 18 + Vite 5      │
    │  SPA Rewrites: vercel.json │
    └───────────┬─────────────┘
                │
                │ HTTPS REST API calls (`/api/*`)
                │ WSS WebSocket upgrade (`Socket.IO`)
                ▼
    ┌───────────────────────────────────────────────┐
    │  Render Backend Web Service                   │
    │  Node.js + Express + Socket.IO                │
    │  Centralized config: backend/src/config/env.js│
    │  CORS: Dynamic multi-origin (Vercel/Custom)   │
    │  Host binding: 0.0.0.0:PORT                   │
    └───────────┬───────────────────────────────────┘
                │
        ┌───────┴───────────────────┬─────────────────────┐
        ▼                           ▼                     ▼
┌──────────────────┐    ┌────────────────────┐   ┌───────────────────────┐
│  MongoDB Atlas   │    │ Google Maps Platform│   │ MeitY Bhashini APIs   │
│  Managed Replica │    │ Maps JS, Places,   │   │ ULCA Machine Trans-   │
│  Connection Pool │    │ Directions, GIS    │   │ lation, Regional TTS  │
└──────────────────┘    └────────────────────┘   └───────────────────────┘
```

### Production Security & Isolation Principles
1. **Frontend Secret Isolation**: All variables exposed to Vite must begin with `VITE_`. No database URIs, JWT secrets, or backend API keys are ever bundled.
2. **Dynamic CORS Whitelisting**: The backend supports multiple origins (`CORS_ORIGINS`), allowing Vercel production and preview deployments (`*.vercel.app`) with credentials enabled.
3. **Fail-Safe Third-Party Integrations**:
   - Google Maps gracefully falls back to Leaflet / OpenStreetMap if `VITE_GOOGLE_MAPS_API_KEY` is missing or invalid.
   - Bhashini translation proxy gracefully falls back to static dictionaries and original text if credentials are missing or offline.
   - Protected terms ("AgriNexus", Centre Codes, Currency amounts) are masked during translation and restored verbatim.

