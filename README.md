# AgriNexus
## Digital Procurement & Market Access Platform
### Smart India Hackathon 2026 – Problem Statement ID: 26032

> **Department of Consumer Affairs (DoCA)**  
> **Ministry of Consumer Affairs, Food & Public Distribution**  
> **Theme:** Smart Automation | **Category:** Software  

---

## 🌾 Project Overview

**AgriNexus** is a government-oriented coordination and digital market access platform designed to optimize agricultural crop procurement across India. It addresses critical bottlenecks at procurement centres—specifically long farmer waiting times, lack of schedule visibility, chaotic manual queues, and payment tracking opacity.

Built on the foundational philosophy **"Right Information. Right Time. Right Place."**, the platform bridges three primary stakeholders:
1. **Farmers:** Mobile-first, bilingual interface for transparent slot booking, smart centre recommendation, live queue tracking, digital receipt viewing, and payment status monitoring.
2. **Procurement Centre Staff:** Counter dashboard for live token calling, produce quality verification, moisture testing, net weighing, server-calculated MSP settlements, and digital receipt issuance.
3. **Government Administrators:** High-level command centre for district/state procurement monitoring, real-time load balancing, health monitoring, congestion alerts, payment pipeline oversight, and compliance audit logging.

> **Environment & Data Notice:**  
> AgriNexus currently operates as an SIH demonstration environment using a curated administrative reference dataset and explicitly labelled demonstration procurement-centre records. Production deployment would require synchronization with authoritative government datasets and verified procurement-centre registries.

---

## 📍 Data Provenance & Administrative Location Scope

| Attribute | Specification |
| :--- | :--- |
| **Dataset Name** | AgriNexus Representative Administrative Reference Dataset |
| **Source Alignment** | Local Government Directory (LGD) / Ministry of Panchayati Raj / Census reference classifications |
| **National Scope** | All 28 States and 8 Union Territories (36 States/UTs total) |
| **Locality Model** | Curated representative administrative localities with seamless `"Can't find your village or town?"` user-entered fallback (`locationSource: 'USER_ENTERED'`) |
| **Coordinates Model** | Administrative centroid approximations for regional distance scoring and routing |
| **GPS Architecture** | Approximate location suggestion with explicit user confirmation modal; never silently mutates registered profile |
| **Procurement Centres** | Demonstration records explicitly tagged `dataSource: 'DEMO'`, `verificationStatus: 'UNVERIFIED'` with badge *"Demo Record — Pending Verification"* |

---

## 🎯 Core Features

* **Role-Based Authentication & Provisioning**:
  * **Farmer Self-Registration**: Guided 4-step wizard collecting strictly necessary onboarding data.
  * **Role Escalation Prevention**: Backend strictly rejects attempts to create `ADMIN` or `CENTRE_STAFF` via public registration (`403 FORBIDDEN`).
  * **Admin Staff Provisioning**: Secure endpoint (`POST /api/admin/staff`) for authorized administrator to onboard staff tied to verified procurement centres.
  * **Role-Verified Login**: Rejects role mismatches (`403 ROLE_MISMATCH`) and routes securely to designated dashboards.
* **Authoritative Administrative Location Hierarchy**:
  * Hierarchical dataset: `State` $\rightarrow$ `District` $\rightarrow$ `Village / Town` with dependent selection resets.
  * Searchable comboboxes with full keyboard navigation (Up/Down/Enter/Esc) and ARIA accessibility.
  * Transparent GPS Device Location vs. Registered Administrative Location indicator.
* **Procurement Centre Data Provenance & Verification**:
  * Explicit lifecycle tracking: `VERIFIED`, `UNVERIFIED`, `NEEDS_REVIEW`, `INACTIVE`.
  * Transparent simulation tags for demo records (`dataSource: 'DEMO'`).
* **Interactive Leaflet Map**:
  * OpenStreetMap layer with exact centre coordinates.
  * Bidirectional sync between centre list and map markers.
  * Mobile-responsive `[ List ] [ Map ]` segment view.
* **Regional Language Architecture**:
  * Central language registry (`languages.js`) supporting active MVP languages (English, Hindi) and expansion roadmap (Marathi, Punjabi, Gujarati, Bengali, Tamil, Telugu, Kannada, Malayalam, Odia, Assamese).
  * Strict single-language UI without mixed-language strings.
* **Government Command Centre (`/admin`)**: Real-time operational overview, system health status, IST operational time (`Asia/Kolkata`), and demo environment notices.
* **Deterministic Centre Health & Congestion Rules**:
  * `HEALTHY`: Wait $< 60\text{ min}$ AND load $< 70\%$.
  * `WATCH`: Wait $60-90\text{ min}$ OR load $70-90\%$.
  * `CRITICAL`: Wait $> 90\text{ min}$ OR load $> 90\%$.
* **Crop & Payment Analytics**: MongoDB aggregation breakdown by crop (`Wheat`, `Paddy`, `Pulses`, `Mustard`) and 8-stage payment pipeline monitoring with SLA tracking.
* **Read-Only Compliance Audit Log (`/admin/audit`)**: Filterable, immutable audit ledger capturing actor user ID, role, action, previous/new states, and timestamp.

---

## 🛠️ Technology Stack

* **Frontend:** React 18, Vite 5, Tailwind CSS 3, React Router DOM 6, Socket.IO Client 4, Lucide Icons, Leaflet Maps, react-i18next, Axios
* **Backend:** Node.js (v18+ LTS), Express.js, Socket.IO 4, Mongoose ODM, JWT (`jsonwebtoken`), `bcryptjs`, Joi, Helmet, CORS, Morgan
* **Database:** MongoDB 6.0+ (Document Store with 2dsphere Geospatial Indexing & In-Memory Dev Fallback)
* **Architecture:** Modular Monolith with clean Controller-Service-Repository separation

---

## 🚀 Verification & Automated Tests

```bash
# 1. Run Complete Automated Backend Test Suite (Auth Security, Location & Workflows)
npm test --prefix backend

# 2. Run End-to-End Live Smoke Test (Localhost:5001)
npm run smoke --prefix backend

# 3. Verify Frontend Production Build
npm run build --prefix frontend
```

---

## ⚙️ Local Development Servers

```bash
# Backend API & Socket Server (http://localhost:5001)
node backend/server.js

# Frontend Development Server (http://localhost:5173)
npm run dev --prefix frontend
```

---

## 🔐 Demo Credentials

* **Farmer**: Phone: `9876543210` | Password: `password123`
* **Centre Staff**: Phone: `9876543211` | Password: `password123` (Assigned: Sehore Mandi)
* **Government Administrator**: Phone: `9876543212` | Password: `adminpassword`
