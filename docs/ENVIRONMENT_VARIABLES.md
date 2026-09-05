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
| `BHASHINI_API_KEY` | Optional | Backend | Backend (`backend/.env`) | Digital India Bhashini (MeitY) ULCA API authorization key for machine translation & voice synthesis. | **Yes** | `backend/src/services/bhashiniService.js` |
| `BHASHINI_USER_ID` | Optional | Backend | Backend (`backend/.env`) | Bhashini account user ID / application ID. | Yes | `backend/src/services/bhashiniService.js` |
| `BHASHINI_PIPELINE_ID` | Optional | Backend | Backend (`backend/.env`) | Bhashini translation pipeline ID (default: `64392f96daac500b55c543d6`). | No | `backend/src/services/bhashiniService.js` |
| `BHASHINI_INFERENCE_URL` | Optional | Backend | Backend (`backend/.env`) | Bhashini inference endpoint (default: `https://dhruva-api.bhashini.gov.in/services/inference/pipeline`). | No | `backend/src/services/bhashiniService.js` |
| `VITE_API_BASE_URL` | Optional | Frontend | Frontend (`frontend/.env`) | REST API endpoint URL consumed by axios client (default: `http://localhost:5001/api`). | No | `frontend/src/services/apiClient.js` |
| `VITE_SOCKET_URL` | Optional | Frontend | Frontend (`frontend/.env`) | Real-time WebSocket server URL consumed by Socket.IO client (default: `http://localhost:5001`). | No | `frontend/src/hooks/useSocketQueue.js` |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional | Frontend | Frontend (`frontend/.env`) | Google Maps JavaScript API key for interactive GIS mapping. When omitted, the app automatically and gracefully falls back to Leaflet. | No (Public Client Key) | `frontend/src/components/common/GoogleMapWrapper.jsx`, `frontend/src/services/googleMapsService.js` |

---

## 2. Third-Party Services Inventory

### Google Maps Platform (Optional with Leaflet Fallback)
- **Environment Variable**: `VITE_GOOGLE_MAPS_API_KEY`
- **Location**: Frontend (`frontend/.env`)
- **Service Layer**: [`googleMapsService.js`](../frontend/src/services/googleMapsService.js) & [`GoogleMapWrapper.jsx`](../frontend/src/components/common/GoogleMapWrapper.jsx)
- **Features**:
  1. Interactive procurement centre visualization using authoritative database coordinates.
  2. Sync between map markers and centre cards (click to pan/highlight).
  3. Dynamic InfoWindows with centre code, verified status, capacity / slots today, Haversine distance, direct "Book Slot" action, and "Get Directions" navigation URL.
  4. Farmer location pin (GPS vs Registered village coordinates).
  5. Search / Geocoding input for address lookup.
  6. Admin command map GIS integration with operational health pins (`AdminMap.jsx` and `AdminCentresMap.jsx`).
- **Graceful Fallback**: If the key is omitted or invalid, AgriNexus **automatically falls back to OpenStreetMap / Leaflet with zero errors or blank screens**.

### Digital India Bhashini APIs (MeitY ULCA)
- **Environment Variables**: `BHASHINI_API_KEY`, `BHASHINI_USER_ID`, `BHASHINI_PIPELINE_ID`, `BHASHINI_INFERENCE_URL`
- **Location**: Backend (`backend/.env`) — Credentials are never exposed to the frontend.
- **Service Layer**:
  - Backend: [`bhashiniService.js`](../backend/src/services/bhashiniService.js), [`bhashiniController.js`](../backend/src/controllers/bhashiniController.js), [`bhashiniRoutes.js`](../backend/src/routes/bhashiniRoutes.js)
  - Frontend: [`bhashiniService.js`](../frontend/src/services/bhashiniService.js), [`LanguageContext.jsx`](../frontend/src/contexts/LanguageContext.jsx), [`LanguageSelector.jsx`](../frontend/src/components/common/LanguageSelector.jsx)
- **Endpoints**:
  - `GET /api/bhashini/languages`: List supported Indian regional languages (Hindi, Marathi, Punjabi, Gujarati, Bengali, Tamil, Telugu, Kannada, Odia, Malayalam, English) and configuration state.
  - `POST /api/bhashini/translate`: Text translation with token masking and in-memory caching.
  - `POST /api/bhashini/batch-translate`: Batch string translation.
  - `POST /api/bhashini/tts`: Text-to-speech voice synthesis.
  - `POST /api/bhashini/stt`: Speech-to-text automated speech recognition.
- **Protected Terms Masking**:
  - Brand name **"AgriNexus"**, centre codes (e.g. `LKO-GOM-001`, `SEH01`), currency amounts (e.g. `₹2,275`), application IDs, and government terms are strictly masked and protected from modification.
- **Graceful Fallback**: If unconfigured or offline, returns original language / static dictionaries with zero application crashes.

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
   - **Never** prefix server-side secrets (`JWT_SECRET`, `BHASHINI_API_KEY`, database passwords) with `VITE_`.
2. **Production Validation**:
   - The backend includes an automated configuration validator in [`backend/src/config/envValidator.js`](../backend/src/config/envValidator.js).
   - In production (`NODE_ENV=production`), the server immediately rejects insecure or default secrets on startup.
3. **Repository Cleanliness**:
   - All `.env` and `.env.*` files containing actual values are gitignored.
   - Only `.env.example` templates with safe placeholders are committed to version control.
