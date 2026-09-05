# AgriNexus — Environment Variables & External API Inventory

This document provides a comprehensive audit of all environment variables, third-party services, SDK integrations, and mock/demo services consumed across the AgriNexus application.

---

## 1. Environment Variable Reference Table

| Variable Name | Required | Environment | Location | Purpose | Secret? | Service / Consumer |
| :--- | :---: | :---: | :---: | :--- | :---: | :--- |
| `NODE_ENV` | Optional | Runtime | Backend | Sets runtime mode (`development`, `production`, `test`). In production, disables verbose stack traces. | No | Node.js / Express |
| `PORT` | Optional | Backend | Backend | Port number for Express HTTP and Socket.IO server (default: `5001`). | No | `backend/server.js` |
| `MONGODB_URI` | Required (Prod) | Backend | Backend | MongoDB database connection URI (default: `mongodb://localhost:27017/smart_procurement_db`). | Yes | `backend/src/config/db.js` |
| `CLIENT_URL` | Optional | Backend | Backend | Allowed CORS origin and Socket.IO connection origin (default: `http://localhost:5173`). | No | `backend/src/app.js`, `backend/server.js` |
| `JWT_SECRET` | Required (Prod) | Backend | Backend | Cryptographic secret key used to sign and verify JSON Web Tokens for session authentication. | **Yes** | `backend/src/controllers/authController.js`, `backend/src/middleware/authMiddleware.js`, `backend/server.js` |
| `JWT_EXPIRES_IN` | Optional | Backend | Backend | JWT expiration window (e.g. `24h`, `7d`). Default: `24h`. | No | `backend/src/controllers/authController.js` |
| `ADMIN_EMAIL` | Optional | Backend | Backend | Pre-provisioned administrator email for government demonstration login (default: `admin@agrinexus.gov.in`). | No | `backend/src/controllers/authController.js`, `backend/src/middleware/authMiddleware.js` |
| `ADMIN_PASSWORD` | Optional | Backend | Backend | Pre-provisioned administrator password (default: `adminpassword`). | **Yes** | `backend/src/middleware/authMiddleware.js` |
| `AGRINEXUS_ADMIN_PASSWORD`| Optional | Backend | Backend | Alias for pre-provisioned administrator password fallback. | **Yes** | `backend/src/middleware/authMiddleware.js` |
| `VITE_API_BASE_URL` | Optional | Frontend | Frontend (`frontend/.env`) | REST API endpoint URL consumed by axios client (default: `http://localhost:5001/api`). | No | `frontend/src/services/apiClient.js` |
| `VITE_SOCKET_URL` | Optional | Frontend | Frontend (`frontend/.env`) | Real-time WebSocket server URL consumed by Socket.IO client (default: `http://localhost:5001`). | No | `frontend/src/hooks/useSocketQueue.js` |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional | Frontend | Frontend (`frontend/.env`) | Google Maps JavaScript API key for interactive GIS mapping. When omitted, the app automatically and gracefully falls back to Leaflet. | No (Public Client Key) | `frontend/src/components/common/GoogleMapWrapper.jsx` |

---

## 2. Third-Party Services Inventory

### Google Maps Platform (Optional)
- **Environment Variable**: `VITE_GOOGLE_MAPS_API_KEY`
- **Location**: Frontend (`frontend/.env`)
- **Usage**: [`GoogleMapWrapper.jsx`](../frontend/src/components/common/GoogleMapWrapper.jsx) for interactive procurement centre discovery, radius searching, and marker overlays.
- **Required Cloud APIs**:
  1. Maps JavaScript API
  2. Places API
  3. Geocoding API
- **Graceful Fallback**: If the key is not provided, is blank, or fails loading, AgriNexus **automatically switches to the built-in Leaflet / OpenStreetMap engine**. No crashes or broken layouts occur.
- **Production Requirement**: Optional. The system works completely in offline/self-hosted environments using Leaflet.

---

## 3. Mock and Simulated Services (Hackathon MVP)

To maintain realistic government procurement workflows without incurring external SaaS dependencies or handling live monetary transactions during hackathon evaluation, the following features are intentionally simulated:

| Feature / Subsystem | Implementation Type | External API Required? | Notes |
| :--- | :--- | :---: | :--- |
| **DBT Payment Settlement Tracker** | Backend Simulation (`paymentController.js`) | **NO** | Simulates the 8-stage Public Financial Management System (PFMS) pipeline. Visually labeled with prominent **"Demo Payment Tracker"** notices. |
| **SMS / Mobile OTP Verification** | In-Memory Simulation | **NO** | Form-level validation ensures authentic 10-digit Indian phone numbers without requiring paid Twilio/Fast2SMS gateways. |
| **Digital Weighbridge Scale** | Certified Input Simulation | **NO** | Allows mandi operators to record calibrated Gross, Tare, and Net weight quintals directly with automated tolerance calculations. |
| **Aadhaar Identity Verification** | Administrative Badge | **NO** | Displays verified identity status for pre-seeded farmer records without integrating UIDAI biometric infrastructure. |

---

## 4. Security Guidelines & Frontend Protection

1. **Vite Public Scope**:
   - Only variables starting with `VITE_` are bundled into client-side code by Vite.
   - **Never** prefix server-side secrets (`JWT_SECRET`, database passwords) with `VITE_`.
2. **Production Validation**:
   - The backend includes an automated configuration validator in [`backend/src/config/envValidator.js`](../backend/src/config/envValidator.js).
   - In production (`NODE_ENV=production`), the server immediately rejects insecure or default secrets on startup.
3. **Repository Cleanliness**:
   - All `.env` and `.env.*` files containing actual values are gitignored.
   - Only `.env.example` templates with safe placeholders are committed to version control.
