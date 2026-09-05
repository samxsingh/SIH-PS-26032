# AgriNexus — Smart Public Agricultural Procurement & Queue Platform

[![Platform](https://img.shields.io/badge/Platform-Mandi%20Procurement-1B4D3E.svg)](#)
[![Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20Socket.io-22252A.svg)](#)
[![Deployment](https://img.shields.io/badge/Deploy-Vercel%20%2B%20Render-3B82F6.svg)](#)
[![GIS](https://img.shields.io/badge/GIS-Google%20Maps%20%7C%20Leaflet-forestgreen.svg)](#)
[![Bhashini](https://img.shields.io/badge/MeitY-Digital%20India%20Bhashini-orange.svg)](#)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#)

> **Ministry of Consumer Affairs, Food and Public Distribution / Smart India Hackathon (SIH 2026)**  
> **Problem Statement 26032**: Transparent, Real-Time Mandi Slot Booking, Automated Token Generation, Fair Assaying, Calibrated Weighment, and Instant Direct Benefit Transfer (DBT) Tracking.

---

## 🏛️ System Overview

AgriNexus connects Indian farmers with minimum support price (MSP) procurement centres across 3 specialized roles:
1. **Farmer Portal**: Crop registration, nearest procurement centre discovery, transparent slot booking, digital tokens, straight-line 8-stage procurement & DBT tracking, and verified identity profile.
2. **Procurement Centre Workspace**: Real-time queue intake, gate arrival verification, automated quality assaying, certified gross/tare weighbridge calculations, and digital acceptance slip issuance.
3. **Government Command Centre**: Statewide procurement KPIs, GIS centre mapping, audit trails, and staff onboarding verifications.

---

## 🌐 Production Architecture (Vercel + Render + MongoDB Atlas)

```
User Browser
     │
     ▼
Vercel (React / Vite SPA)
     │
     │ HTTPS REST API
     │ WSS WebSocket (Socket.IO)
     ▼
Render (Node.js / Express Web Service)
     ├── MongoDB Atlas (Managed Cloud Database)
     ├── Google Maps Platform (GIS, Directions, Places)
     └── Digital India Bhashini APIs (MeitY Regional Translation Pipeline)
```

---

## 🚀 Deployment Guides

### 1. Frontend Deployment (Vercel)
1. Import repository into **Vercel**.
2. Set **Root Directory** to `frontend` (or use the root directory with `frontend/vercel.json` SPA rewrite rules).
3. Set **Framework Preset** to **Vite**.
4. Configure Environment Variables in Vercel Project Settings:
   ```env
   VITE_API_BASE_URL=https://your-agrinexus-backend.onrender.com/api
   VITE_SOCKET_URL=https://your-agrinexus-backend.onrender.com
   VITE_GOOGLE_MAPS_API_KEY=your_restricted_google_maps_key
   VITE_APP_ENV=production
   ```
5. Deploy. All SPA routes (`/login`, `/access`, `/farmer/bookings`, etc.) resolve seamlessly via `vercel.json`.

### 2. Backend Deployment (Render)
1. Create a new **Web Service** on **Render** connected to the repository.
2. Set **Root Directory** to `backend`.
3. Set **Environment** to `Node`.
4. Configure Build and Start Commands:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Configure Environment Variables in Render:
   ```env
   NODE_ENV=production
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
   *(Note: Render automatically supplies `PORT`, and backend binds to `0.0.0.0:PORT` automatically).*

---

## 💻 Local Development Setup

```bash
# 1. Install dependencies
npm run setup

# 2. Seed database with demo procurement centres and crops
npm run seed --prefix backend

# 3. Start Backend Server (http://localhost:5001)
node backend/server.js

# 4. Start Frontend Client (http://localhost:5173)
npm run dev --prefix frontend
```

---

## 🧪 Testing & Verification

```bash
# 1. Run Complete Automated Backend Test Suite
npm test --prefix backend

# 2. Run Bhashini & Google Maps Integration Tests
node backend/test-bhashini-maps.js

# 3. Run End-to-End Live System Smoke Test
npm run smoke --prefix backend

# 4. Run Frontend Production Build
npm run build --prefix frontend
```

---

## 🔐 Demonstration Credentials (One-Click "Use Demo Account")

* **Farmer**:
  - Login Type: **Mobile Number + Password**
  - Mobile: `9876543210`
  - Password: `password123`
* **Procurement Centre**:
  - Login Type: **Email + Password**
  - Email: `gomtinagar.centre@agrinexus.demo` (or `sehore.centre@agrinexus.demo`)
  - Password: `password123`
* **Government Administrator**:
  - Login Type: **Email + Password**
  - Email: `admin@agrinexus.gov.in`
  - Password: `adminpassword`
