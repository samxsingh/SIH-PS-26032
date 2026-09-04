# Product Requirements Document (PRD)
## Smart India Hackathon 2026 – Problem Statement ID: 26032
### Smart Procurement Platform: Government-Oriented Crop Procurement & Queue Management System

---

## 1. Executive Summary

The **Smart Procurement Platform** is a government-oriented digital coordination solution designed to transform agricultural crop procurement across India. Developed for the **Department of Consumer Affairs (DoCA)** under the **Ministry of Consumer Affairs, Food & Public Distribution**, this platform directly addresses severe bottlenecks at procurement centres—specifically long farmer wait times, opacity in scheduling, queue chaos, and post-procurement payment status uncertainty.

By connecting three primary stakeholders—**Farmers**, **Procurement Centre Staff**, and **Government Administrators**—the platform operates under a core principle: **"Right Information. Right Time. Right Place."**

The platform combines mobile-first, low-literacy-friendly UX for farmers with real-time backend-authoritative queue management, smart centre recommendations, transparent procurement workflow tracking, and high-level administrative operational visibility.

---

## 2. Official Problem Statement

* **Problem Statement ID:** 26032
* **Problem Statement:** "Farmers often face long waiting times, lack of information regarding procurement schedules, and uncertainty about procurement status."
* **Expected Solution:** Develop a platform that:
  1. Enables farmer registration and slot booking.
  2. Provides real-time queue management.
  3. Sends SMS/app notifications.
  4. Tracks procurement and payment status.
  5. Reduces congestion and waiting time at procurement centres.
* **Organization:** Ministry of Consumer Affairs, Food & Public Distribution
* **Department:** Department of Consumer Affairs (DoCA)
* **Category:** Software
* **Theme:** Smart Automation

---

## 3. Problem Analysis

During peak harvest seasons (Rabi & Kharif procurement windows), millions of farmers transport heavy crop yields to Minimum Support Price (MSP) procurement centres and Agricultural Produce Market Committees (APMCs). Without advance coordination:
* Hundreds of tractor-trolleys arrive unannounced at dawn, creating massive road blockades and physical congestion outside centres.
* Farmers wait anywhere from 12 to 72 hours under exposed weather conditions, incurring loss of wages and high transport demurrage fees.
* Centre staff suffer from extreme operational overload, manual paperwork errors, and unpredictable crop inflow.
* Regional and national administrators lack real-time visibility into centre loads, leading to misallocated resources, unaddressed bottlenecks, and public dissatisfaction.

---

## 4. Root Causes

1. **Lack of Scheduling & Slot Booking:** Crop arrival is uncoordinated; all farmers attempt to sell on the same day due to fear of missing procurement targets.
2. **Absence of Real-Time Queue Visibility:** Farmers have no mechanism to check queue length or estimated wait time before leaving home.
3. **Manual & Opaque Queue Management:** Tokens are written on paper or issued verbally, creating vulnerability to favoritism, queue jumping, and confusion.
4. **Information Asymmetry:** Farmers do not receive structured status updates regarding crop verification, quality testing, weighing, or payment processing.
5. **Static Distribution:** Farmers default to the nearest known centre even if an adjacent centre 5 km further has zero wait time.

---

## 5. Existing User Pain Points

| Stakeholder | Pain Point | Impact |
| :--- | :--- | :--- |
| **Farmer** | 24-48 hr physical wait in crowded centres | Fatigue, income loss, high transport costs, safety risks |
| **Farmer** | Zero tracking of payment status post-delivery | Anxiety, repeated physical visits to banks/centres |
| **Farmer** | Complex digital apps with dense text/English | Inability to use existing government portals independently |
| **Centre Staff** | Unpredictable crowds, manual record keeping | Errors in weighing slips, high stress, slow throughput |
| **Government Admin** | No live view of centre congestion or bottlenecks | Delayed intervention, inefficient grain storage routing |

---

## 6. Product Vision

To establish a trusted, simple, and authoritative digital bridge between Indian farmers and state procurement infrastructure.

> **Core Philosophy:** "Right Information. Right Time. Right Place."

The system ensures that no farmer arrives at a procurement centre without a confirmed slot, an estimated turn time, and complete transparency from booking through final payment clearance.

---

## 7. Product Goals

* **Reduce Wait Time:** Cut physical waiting time at procurement centres by at least 60% through staggered slot booking.
* **Eliminate Unplanned Congestion:** Distribute farmer arrivals smoothly across operating hours.
* **Provide End-to-End Transparency:** Give farmers live status tracking across 8 procurement & payment stages.
* **Ensure Inclusive Access:** Deliver an intuitive Hindi/English user interface designed specifically for low digital literacy and elderly users.
* **Empower Operations:** Provide centre staff with a real-time queue caller dashboard and administrators with a macro command center.

---

## 8. Non-Goals

* **Actual Banking Transactions:** The MVP tracks payment status; it does **not** execute actual fund transfers or integrate live banking APIs.
* **LLM / AI Chatbots for Marketing:** The MVP uses deterministic, explainable algorithms for centre recommendations and wait-time estimations—not LLMs.
* **Biometric Hardware Integration:** Physical weighing scales and Aadhaar fingerprint scanners will be simulated via clean administrative web interfaces in the MVP.
* **Commodity Trading / B2B E-Commerce:** The platform focuses strictly on government MSP procurement, not private crop selling or bidding.

---

## 9. Target Users

1. **Small & Marginal Farmers:** Primary producers selling harvested grains (wheat, paddy, pulses). Possess entry-level smartphones; require high legibility and regional language support.
2. **Procurement Centre In-Charge & Verification Staff:** Officials responsible for verifying farmer identity, inspecting moisture/quality, operating weighing scales, and calling tokens.
3. **District & State Agricultural Administrators:** DoCA officials monitoring district-level procurement quotas, queue congestion, centre performance, and payment disbursements.

---

## 10. User Personas

### Persona A: Ramesh Kumar (Farmer)
* **Age:** 54 | **Location:** Sehore, Madhya Pradesh | **Literacy:** Basic Hindi reading, limited English
* **Device:** Budget Android Smartphone (3G/4G connectivity)
* **Goals:** Book a wheat procurement slot, avoid sleeping overnight at the mandi, receive clear SMS updates when payment is credited.
* **Frustrations:** Past experiences of standing in 2-day queues; confusing government forms with tiny text.

### Persona B: Suresh Verma (Centre Manager)
* **Age:** 41 | **Role:** Mandi Supervisor at Krishi Seva Kendra, Sehore
* **Device:** Desktop PC / Tablet at centre counter
* **Goals:** Process 150 farmer shipments daily smoothly without arguments, call next token with a single click, log moisture test results quickly.
* **Frustrations:** Unmanageable morning crowds, paper token losses, manual record reconciliation at day's end.

### Persona C: Dr. Anita Sharma (District Administrator)
* **Age:** 48 | **Role:** Deputy Director, Department of Consumer Affairs
* **Device:** Laptop / Desktop PC
* **Goals:** Oversee 28 procurement centres across the district, identify overloaded centres in real-time, ensure payment processing SLAs are met.
* **Frustrations:** Receiving reports 48 hours late; lack of centralized real-time dashboard during peak harvest.

---

## 11. Three User Roles

1. **FARMER:** Slot booker, queue tracking user, notifications recipient.
2. **PROCUREMENT CENTRE STAFF:** Live queue operator, verification controller, weighing & procurement logger.
3. **GOVERNMENT ADMINISTRATOR:** System-wide supervisor, analytics reviewer, centre load balancer, audit logger.

---

## 12. Role Permissions (RBAC Matrix)

| Module / Feature | Farmer | Centre Staff | Govt Admin |
| :--- | :---: | :---: | :---: |
| Self-Registration & Profile | ✅ | ❌ | ❌ |
| Language Selection (Hindi/English) | ✅ | ✅ | ✅ |
| Centre Discovery & Maps | ✅ | ✅ | ✅ |
| Smart Recommendation Engine | ✅ | ❌ | ✅ |
| Slot Booking (Create/Cancel) | ✅ | ❌ | ❌ |
| View Personal Token & Live Queue Position | ✅ | ❌ | ❌ |
| Live Queue Control (Call Next / Process) | ❌ | ✅ | ❌ |
| Update Procurement Workflow (Verify/Weigh) | ❌ | ✅ | ❌ |
| Update Payment Status | ❌ | ✅ (Initiate) | ✅ (Approve/Update) |
| Manage Centre Operating Hours & Slots | ❌ | ❌ | ✅ |
| District/State Analytics Dashboard | ❌ | ❌ | ✅ |
| View System Audit Logs | ❌ | ❌ | ✅ |

---

## 13. Farmer User Journey

```
[Login / Register with Mobile & OTP]
                  ↓
[Select Preferred Language: Hindi / English]
                  ↓
[Select Crop Type & Estimated Quantity (in Quintals)]
                  ↓
[View Recommended & Nearby Procurement Centres]
                  ↓
[Choose Centre & Select Available Date / Time Slot]
                  ↓
[Confirm Booking → Receive Digital Token & Booking Summary]
                  ↓
[Track Live Queue & Estimated Wait Time on Booking Day]
                  ↓
[Arrive at Centre when Called → Show Token QR / ID]
                  ↓
[Pass Verification & Quality Testing → Weighing]
                  ↓
[Receive Procurement Completion Digital Receipt]
                  ↓
[Track Payment Status (Initiated → Processing → Paid)]
```

---

## 14. Centre Staff User Journey

```
[Secure Login to Assigned Procurement Centre Portal]
                  ↓
[View Today's Overview: Total Booked, Arrived, Waiting, Completed]
                  ↓
[Open Live Queue Management Board]
                  ↓
[Click "Call Next Farmer" → System advances Queue State to CALLED]
                  ↓
[Verify Farmer ID & Slot Token upon physical arrival → Mark ARRIVED]
                  ↓
[Initiate Quality Inspection & Moisture Test → Mark VERIFICATION]
                  ↓
[Record Net Quantity & Moisture Content → Mark WEIGHING]
                  ↓
[Submit Final Procurement Record → System generates Receipt]
                  ↓
[Advance Status to COMPLETED & Automatically Trigger Payment Pipeline]
```

---

## 15. Government Admin User Journey

```
[Secure Admin Login to Command Centre]
                  ↓
[View State/District Procurement KPI Cards (Total Grains, Active Centres, Active Farmers)]
                  ↓
[Inspect Real-Time Heatmap & Load Indicators for all Centres]
                  ↓
[Filter Centres by Bottlenecks (Wait Time > 90 min or Queue > 30 farmers)]
                  ↓
[Drill Down into Specific Centre Operations & Staff Activity Logs]
                  ↓
[Monitor Payment Status Distribution & SLA Breaches]
                  ↓
[Export Audit Logs & Analytical Reports for Policy Compliance]
```

---

## 16. End-to-End System Journey

```
+-----------------------------------------------------------------------------------+
|                                 FARMER APP                                        |
|  [Book Slot] ---> [Receive Token] ---> [Monitor Live Queue] ---> [View Payment]   |
+------------------------------------------|----------------------------------------+
                                           | (Real-time Socket.IO Sync)
                                           v
+-----------------------------------------------------------------------------------+
|                             BACKEND QUEUE ENGINE                                  |
|   WAITING ----> CALLED ----> ARRIVED ----> VERIFICATION ----> WEIGHING ----> PAID |
+------------------------------------------|----------------------------------------+
                                           | (Live State Updates)
                                           v
+-----------------------------------------------------------------------------------+
|                            CENTRE STAFF DASHBOARD                                 |
|  [Call Next Token] ---> [Log Moisture/Weight] ---> [Complete Procurement]        |
+------------------------------------------|----------------------------------------+
                                           | (Aggregate Analytics)
                                           v
+-----------------------------------------------------------------------------------+
|                           GOVERNMENT ADMIN COMMAND                                |
|  [District Overview] ---> [Load Congestion Alert] ---> [Audit & Compliance]       |
+-----------------------------------------------------------------------------------+
```

---

## 17. Centre Discovery

Farmers can discover procurement centres through two complementary mechanisms:
1. **Interactive Map View:** Visual pinpointing of nearby centres within a 50 km radius, displaying distance, operating hours, and current wait status.
2. **List / Card View:** Filterable list sorted by distance, wait time, or available slots for today and upcoming days.

---

## 18. Smart Recommendation

The platform features a **Transparent Deterministic Recommendation Engine**. It calculates a suitability score for each available centre relative to the farmer's registered location.

### Scoring Formula:
$$\text{Score} = (w_d \cdot S_{\text{dist}}) + (w_w \cdot S_{\text{wait}}) + (w_q \cdot S_{\text{queue}}) + (w_c \cdot S_{\text{cap}}) + (w_s \cdot S_{\text{slot}})$$

Where:
* **Distance Factor ($w_d = 0.40$):** Proximity to farmer's village.
* **Estimated Wait Time Factor ($w_w = 0.30$):** Inversely proportional to live waiting time.
* **Current Queue Load ($w_q = 0.15$):** Active farmers currently waiting.
* **Centre Capacity ($w_c = 0.10$):** Daily metric quintal throughput capacity.
* **Slot Availability ($w_s = 0.05$):** Immediate open slots today vs tomorrow.

**Transparency Guarantee:** The UI explicitly displays *why* a centre is recommended (e.g., *"Recommended: 6.4 km away, only 12 min wait vs 75 min at nearest centre"*). Manual selection is **always** permitted.

---

## 19. Slot Booking

* **Time Slots:** Staggered 1-hour windows (e.g., 09:00 AM - 10:00 AM, 10:00 AM - 11:00 AM).
* **Capacity Quota:** Fixed maximum quintals and maximum farmers per hour per centre to prevent physical bottlenecking.
* **Digital Token Generation:** Upon confirmation, the backend generates a unique token format: `TOK-<CENTRE_CODE>-<YYYYMMDD>-<SEQ>` (e.g., `TOK-SEH01-20261015-042`).
* **Booking Rules:** A farmer can hold only 1 active booking per crop harvest cycle until completed or cancelled.

---

## 20. Queue Management

The backend maintains strict authority over queue state. The queue follows a deterministic state machine:

```
  [WAITING]  --->  [CALLED]  --->  [ARRIVED]  --->  [VERIFICATION]  --->  [WEIGHING]  --->  [COMPLETED]
      |               |
      v               v
  [CANCELLED]    [NO_SHOW]
```

### Queue Rules:
* **Backend Authority:** Frontend components only render server-emitted queue state.
* **Auto-Sequence:** Token numbers increment monotonically per centre per day.
* **No-Show Handling:** Tokens called but un-arrived after 30 minutes are transitioned to `NO_SHOW` and can be re-queued by staff.

---

## 21. Real-Time Updates

* **Technology:** Socket.IO websockets with fallback polling.
* **Channels/Rooms:**
  * `centre_<CENTRE_ID>`: Broadcasts live token updates to centre staff and watching farmers.
  * `farmer_<USER_ID>`: Delivers personalized notifications (e.g., *"Your token TOK-042 is called! Please proceed to Counter 2"*).

---

## 22. Procurement Tracking

The complete physical procurement journey is tracked step-by-step:
1. **Verification:** Farmer ID, land record reference, and crop quality/moisture content logged.
2. **Weighing:** Gross weight, tare weight of trolley, and net crop weight logged.
3. **Receipt Generation:** Instant digital procurement receipt created with serial number, net weight, rate per quintal (MSP), and total payable amount.

---

## 23. Payment Status Tracking

The platform provides a clear, 8-stage progress tracker for farmers:

```
[1. Slot Confirmed] ➔ [2. Arrived at Centre] ➔ [3. Verification] ➔ [4. Weighing] ➔
[5. Procurement Completed] ➔ [6. Payment Initiated] ➔ [7. Payment Processing] ➔ [8. Paid]
```

> **MVP Scope Note:** Actual banking money transfer APIs are out of scope. Payment states are updated via staff/admin triggers or automated workflow timers for demonstration.

---

## 24. Notifications

An abstracted Notification Service handles multi-channel alerts:
* **In-App Notifications:** Real-time toast alerts and notification center bell updates.
* **SMS Notifications (Mocked for MVP):** Console/UI simulated SMS triggers for low-connectivity environments.
* **Notification Triggers:** Booking confirmation, 2-hour slot reminder, token called alert, procurement completed, payment status updated to `PAID`.

---

## 25. Maps

* **Provider:** Leaflet.js with OpenStreetMap tiles (Open-source, no external API key dependency required for MVP).
* **Capabilities:** Display user location, plot nearby procurement centres with custom green map markers, render popups with wait times, calculate straight-line/route distance, and open Google Maps navigation link.

---

## 26. Language / i18n

* **MVP Supported Languages:** English (`en`), Hindi (`hi`).
* **Architecture:** `react-i18next` abstraction with standard JSON key translation bundles.
* **Extensibility:** Zero hardcoded string literals in frontend code. Ready for expansion to Punjabi (`pa`), Marathi (`mr`), Bengali (`bn`), Telugu (`te`), Tamil (`ta`).

---

## 27. Accessibility

Designed in accordance with government digital accessibility norms:
* **Visual Palette:** Light-first Warm Ivory (`#FAF8F5`), Forest Green (`#1B4D3E`), Wheat Accent (`#D4A373`), Dark Neutral text (`#22252A`). High contrast ratio (WCAG AA compliant).
* **Touch Targets:** Minimum $48 \times 48\text{ px}$ for all primary buttons and interactive elements.
* **Redundant Indicators:** Statuses use distinct icons + text labels alongside colors (never color alone).
* **Typography:** Large, readable Google Fonts (Inter / Outfit) with $18\text{px}+$ base size for farmer portal.

---

## 28. Responsive Design

* **Farmer Portal:** Mobile-first responsive layout (320px to 430px smartphone focus, scales gracefully to tablet/desktop).
* **Centre Staff Dashboard:** Tablet/Desktop-first optimized for counter displays ($1024\text{px}+$ desktop displays).
* **Government Command Centre:** Desktop-first multi-card dashboard ($1280\text{px}+$ widescreen monitor focus).

---

## 29. Security Requirements

* **Authentication:** JSON Web Tokens (JWT) with secure HTTP-only cookie or Bearer header storage.
* **Password Hashing:** `bcryptjs` with salt round factor of 10.
* **Role-Based Access Control (RBAC):** Backend route middleware (`verifyToken`, `requireRole(['ADMIN'])`).
* **Input Sanitization:** Express request validation via `joi` or `zod` to prevent SQL/NoSQL injection and XSS.
* **Rate Limiting:** `express-rate-limit` on public routes (`/api/auth/*`).

---

## 30. Data Privacy Considerations

* **Farmer ID & Aadhaar Handling:** No raw 12-digit Aadhaar stored. Masked representation (`XXXX-XXXX-1234`) stored for verification display only.
* **Phone Number Masking:** Publicly displayed numbers masked as `+91 98XXX XX321`.
* **Data Minimization:** Collect only necessary crop, land acreage, and location data required for procurement slot allocation.

---

## 31. Functional Requirements

### Module A: Farmer Portal
* **FR-F1:** Farmer can register with Name, Phone, District, State, and Landholding Size.
* **FR-F2:** Farmer can switch UI language instantly between English and Hindi.
* **FR-F3:** Farmer can view recommended centres with clear scoring explanation.
* **FR-F4:** Farmer can select date and 1-hour time slot for crop delivery.
* **FR-F5:** Farmer can view active digital token QR code and real-time live queue count.
* **FR-F6:** Farmer can view procurement digital receipt and track 8-stage payment progress.

### Module B: Centre Staff Portal
* **FR-S1:** Staff can view assigned centre's daily booking roster and summary statistics.
* **FR-S2:** Staff can trigger "Call Next Token" which updates live queue across all connected clients.
* **FR-S3:** Staff can record moisture content, grain quality grade, and net weight.
* **FR-S4:** Staff can mark no-shows or cancel invalid bookings.

### Module C: Government Admin Portal
* **FR-A1:** Admin can monitor total procurement volume (quintals), total payments disbursed, and active centre count.
* **FR-A2:** Admin can view real-time centre load list and receive alerts for centres exceeding 90 min wait thresholds.
* **FR-A3:** Admin can view system-wide audit logs of queue overrides and procurement submissions.

---

## 32. Non-Functional Requirements

* **Performance:** API response time $< 200\text{ ms}$ for standard requests; Socket real-time latency $< 100\text{ ms}$.
* **Availability:** Designed for 99.9% uptime during peak procurement harvest windows.
* **Usability:** 90%+ success rate for first-time farmer user completing slot booking within 3 minutes without assistance.
* **Scalability:** Modular monolith backend capable of handling 10,000 concurrent socket connections.

---

## 33. MVP Scope

* Full 3-role authentication (Farmer, Staff, Admin) with role-based routing.
* Centre discovery with Leaflet maps and transparent deterministic recommendation engine.
* Staggered slot booking engine with unique digital token generation.
* Backend-authoritative Socket.IO queue management with live token caller dashboard.
* 8-stage procurement and simulated payment status tracker with digital receipt preview.
* Multi-channel notification simulation (In-app + Mock SMS logs).
* Bilingual support (English & Hindi).
* Executive command centre dashboard with load alerts and analytics charts.

---

## 34. Future Scope

* **Voice Assistant / Speech Interface:** Interactive Voice Response (IVR) phone booking for feature phone users without internet.
* **ML-Based Predictive Queueing:** XGBoost model predicting queue wait times based on historical weather, traffic, and arrival patterns.
* **Government Portal Integrations:** Live API integration with **e-NAM** (National Agriculture Market), **PM-KISAN** database for automated land verification, and **PFMS** (Public Financial Management System) for direct bank transfers.
* **Regional Language Expansion:** Support for Punjabi, Marathi, Bengali, Telugu, and Tamil.

---

## 35. AI/ML Opportunities

While the MVP deliberately utilizes a deterministic algorithm for transparency and reliability during SIH evaluation, the system architecture includes pluggable interfaces for:
1. **Estimated Wait Time Prediction:** Regression model trained on historical processing times per quintal per crop type.
2. **Centre Load Balancing Optimizer:** Linear programming model recommending global farmer redistribution across district centres to minimize aggregate transit and wait times.

---

## 36. Voice / Multilingual Future Scope

* **Web Speech API:** Voice search for finding centres by speaking village names in Hindi.
* **IVR Automated Toll-Free Booking:** Phone line integration allowing farmers to press 1 to book slots via voice prompts, automatically syncing with the central database.

---

## 37. Government Integration Future Scope

* **PFMS (Public Financial Management System):** Direct DBT (Direct Benefit Transfer) status sync via Webhooks.
* **PM-KISAN Database:** Automatic cross-verification of farmer identity and registered land acreage using Farmer ID.
* **AgriStack / Krishi Decision Support System:** Data feeds providing central government visibility into grain buffer stocks.

---

## 38. Success Metrics

* **Average Wait Time:** Reduction from historical 18+ hours to $< 45$ minutes per farmer.
* **Centre Throughput:** 35% increase in daily processed farmers per centre due to organized staggered arrivals.
* **Farmer Satisfaction:** $> 85\%$ positive feedback on digital token ease of use.
* **Payment Transparency:** 100% visibility of payment stage progression, reducing physical enquiry visits to zero.

---

## 39. Demo Scenario (SIH Jury Pitch Script)

1. **Act I (The Farmer's Story):** Ramesh opens the app on his phone in Hindi. He sees that the nearest mandi is crowded (75 min wait), but the Smart Recommendation suggests *Krishi Seva Kendra, Sehore* (6.4 km away, 15 min wait). He books a 10:00 AM slot and gets Token `TOK-SEH01-042`.
2. **Act II (The Centre Staff's Control):** Mandi supervisor Suresh opens his counter tablet. He clicks "Call Next Token". Token `TOK-SEH01-042` lights up. Ramesh receives a live notification on his phone. Suresh verifies Ramesh's crop, enters 50 Quintals Wheat @ ₹2,275/Quintal, and completes procurement.
3. **Act III (The Administrator's Oversight):** Government officer Dr. Anita views her State Command Centre. She sees real-time procurement volume tick up by 50 Quintals, views the updated payment processing queue, and observes zero queue bottlenecks across District Sehore.

---

## 40. Acceptance Criteria

* **AC-1:** A farmer must be able to complete a slot booking in $< 4$ steps after login.
* **AC-2:** Queue state transitions (`WAITING` $\rightarrow$ `CALLED` $\rightarrow$ `ARRIVED` $\rightarrow$ `VERIFICATION` $\rightarrow$ `WEIGHING` $\rightarrow$ `COMPLETED`) must broadcast to all connected clients within 500ms.
* **AC-3:** Manual centre selection must remain fully accessible even when a smart recommendation is presented.
* **AC-4:** Payment status tracker must correctly reflect state changes triggered by staff/admin.
* **AC-5:** Switching language between English and Hindi must immediately update all UI text without requiring a page reload or state loss.

---

## 41. Definition of Done

* All code committed to git repository with clean modular structure.
* PRD and Architecture documentation updated and cross-checked for consistency.
* Both Frontend and Backend execute cleanly with zero build errors or unhandled console exceptions.
* Seed dataset populated with realistic Indian procurement centres, slots, and demo users.
* Manual verification of all 3 user roles completed against acceptance criteria.

---

## 42. Risks and Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Poor Network Connectivity at Mandis** | Sockets disconnect, state desynchronizes | Implement Socket.IO reconnect logic with HTTP polling fallback and client offline queuing |
| **Digital Illiteracy / User Error** | Farmers book incorrect slots or miss tokens | High-contrast UI, large touch buttons, SMS reminders, clear token status displays |
| **Fake / Duplicate Bookings** | Centre overload from fake accounts | Require mobile OTP verification and limit active bookings to 1 per farmer per harvest |

---

## 43. Assumptions

* Procurement centres have at least one desktop or tablet device with internet connectivity.
* Government MSP rates per crop quintal are fixed and configured by system administrators.
* Farmers have access to a mobile phone (smartphone or basic phone for SMS).

---

## 44. Constraints

* The solution must be built using React, Vite, Tailwind CSS, Node.js, Express.js, MongoDB, and Socket.IO.
* Visual aesthetics must adhere strictly to government digital service standards (light-first warm palette, high contrast, zero dark-mode startup aesthetics).
* External API integrations (SMS, Banking, PFMS) must be implemented with clean mock interfaces clearly labeled as simulated for SIH demonstration.

---

## 45. Implementation Status

| Implementation Phase | Description | Status | Target Completion |
| :--- | :--- | :---: | :---: |
| **Phase 1** | Foundation, Architecture, Authentication & Design System | 🟢 **COMPLETED** | Phase 1 Execution |
| **Phase 2** | Farmer Experience, Centre Discovery, Recommendation & Booking | 🟢 **COMPLETED** | Phase 2 Execution |
| **Phase 3** | Real-Time Queue & Procurement Centre Operations | 🟢 **COMPLETED** | Phase 3 Execution |
| **Phase 4** | Procurement Journey, Payment Status, Notifications & Maps | 🟢 **COMPLETED** | Phase 4 Execution |
| **Phase 5** | Government Command Centre, Analytics & Operational Oversight | 🟢 **COMPLETED** | Phase 5 Execution |
| **Phase 6** | Accessibility, Hindi, Reliability, Performance, Polish & Demo Readiness | 🟢 **COMPLETED** | Phase 6 Execution |

*(Note: Phase 1 implementation will commence only after formal user approval of the documentation source of truth.)*
