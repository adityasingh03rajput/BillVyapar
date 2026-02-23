# Software Requirements Specification (SRS)
 for
 **Hukum – Business Billing & Document Management System**

 Version **1.0** approved

 Prepared by: **<author>**

 Organization: **<organization>**

 Date created: **<date created>**

 ## Table of Contents
 - Revision History
 - 1. Introduction
   - 1.1 Purpose
   - 1.2 Document Conventions
   - 1.3 Intended Audience and Reading Suggestions
   - 1.4 Product Scope
   - 1.5 References
 - 2. Overall Description
   - 2.1 Product Perspective
   - 2.2 Product Functions
   - 2.3 User Classes and Characteristics
   - 2.4 Operating Environment
   - 2.5 Design and Implementation Constraints
   - 2.6 User Documentation
   - 2.7 Assumptions and Dependencies
 - 3. External Interface Requirements
   - 3.1 User Interfaces
   - 3.2 Hardware Interfaces
   - 3.3 Software Interfaces
   - 3.4 Communications Interfaces
 - 4. System Features
 - 5. Other Nonfunctional Requirements
 - 6. Other Requirements
 - Appendix A: Glossary
 - Appendix B: Analysis Models
 - Appendix C: To Be Determined List

 ## Revision History
 | Name | Date | Reason For Changes | Version |
 |---|---|---|---|
 | <author> | <date> | Initial draft for Hukum | 1.0 |

 # 1. Introduction

 ## 1.1 Purpose
 This Software Requirements Specification (SRS) defines the functional and non-functional requirements for **Hukum**, a web-based business application used to create and manage billing documents (e.g., invoices, quotations, proforma invoices, orders, delivery challans), customers, items, and subscription-based access control with offline usage capability.

 This SRS applies to **Hukum v1.0** and covers the complete system including:
 - Frontend (web application)
 - Backend REST API
 - Database persistence
 - Authentication, device session enforcement
 - Subscription validation (online + offline)

 ## 1.2 Document Conventions
 - **Must / Shall** indicates mandatory requirements.
 - **Should** indicates recommended requirements.
 - **May** indicates optional requirements.
 - Functional requirements are labeled as **REQ-xxx**.
 - Priorities:
   - **High**: required for core product operation
   - **Medium**: important but not blocking initial delivery
   - **Low**: enhancements / optional features

 ## 1.3 Intended Audience and Reading Suggestions
 This document is intended for:
 - Developers (Frontend/Backend): implement features per requirements.
 - Testers/QA: derive test cases from system features and requirements.
 - Project Managers: scope, priorities, and release planning.
 - Stakeholders/Client: confirm expected behavior and business rules.

 Suggested reading:
 - Sections **1–2** for overview and scope
 - Section **4** for complete functional requirements
 - Section **5** for quality, security, offline/subscription constraints

 ## 1.4 Product Scope
 Hukum is designed to help businesses manage billing and business documents with:
 - Fast data entry (typeahead selection for customers/items)
 - Accurate tax calculations (GST rates)
 - Per-item currency support
 - PDF generation/export
 - Analytics reporting
 - Subscription enforcement with offline access control

 Primary objectives:
 - Reduce manual billing effort
 - Improve accuracy in totals/taxes/discounts
 - Provide reliable access control tied to subscription validity

 ## 1.5 References
 - IEEE SRS Template (this document structure)
 - Internal project codebase:
   - Frontend: React + TypeScript (Vite)
   - Backend: Node.js + Express
   - Database: MongoDB + Mongoose
 - REST API endpoints (backend):
   - `/auth/*`, `/profiles`, `/documents`, `/customers`, `/items`, `/analytics`, `/subscription`

 # 2. Overall Description

 ## 2.1 Product Perspective
 Hukum is a **client-server web application**:
 - Frontend: SPA (single-page app) running in browser
 - Backend: REST API server
 - Database: MongoDB for storing user/business data

 Major subsystems:
 - Authentication + Device Session Management
 - Subscription Management (validation/renewal)
 - Business Profiles
 - Documents Management
 - Customers Catalog
 - Items Catalog
 - Analytics Dashboard
 - PDF/Export subsystem (client-side generation)

 ## 2.2 Product Functions
 High-level functions include:
 - User login/signup and session validation
 - Single-device session enforcement (per user)
 - Subscription validation (online + offline)
 - Create/manage business profiles
 - Create/edit documents: invoice, quotation, proforma, order, challan, etc.
 - Customer and item catalogs with preset autofill
 - Item-level tax, discounts, and totals calculation
 - Export/share document as PDF
 - Analytics (sales totals, outstanding amounts, top items, trends)
 - Offline-friendly behavior with cached subscription validation

 ## 2.3 User Classes and Characteristics
 - Business Owner / Admin
   - Primary user
   - Creates documents, manages customers/items, views analytics
 - Accountant / Staff
   - Uses document creation and customer/item catalog
 - System Administrator (internal)
   - Maintains deployment, monitoring, support

 All users are assumed to have basic web app familiarity.

 ## 2.4 Operating Environment
 - Client: Modern browser (Chrome/Edge/Firefox)
 - OS: Windows, macOS, Linux (browser-based)
 - Server: Node.js runtime environment
 - Database: MongoDB instance (local or hosted)

 ## 2.5 Design and Implementation Constraints
 - Tech stack:
   - Frontend: React + TypeScript + Vite
   - Backend: Express (Node.js, ES modules)
   - Database: Mongoose/MongoDB
 - Authentication: JWT-based access tokens
 - Device enforcement: `X-Device-ID` header checked server-side
 - Profile isolation: `X-Profile-ID` required on profile-specific routes
 - Offline mode:
   - Must enforce subscription expiry using cached signed tokens
   - Must prevent simple clock rollback bypass

 ## 2.6 User Documentation
 - In-app UI labels, placeholders, and validation messages
 - Subscription and renewal guidance page (Welcome/Subscription page)

 ## 2.7 Assumptions and Dependencies
 Assumptions:
 - Users have stable internet at least periodically for subscription refresh.
 - Users use one primary device (single-device security enforced).

 Dependencies:
 - MongoDB availability for normal online operation
 - LocalStorage availability for offline caching
 - Subscription signing keys configured (recommended RS256 keys)

 # 3. External Interface Requirements

 ## 3.1 User Interfaces
 Major screens:
 - Login / Signup
 - Profiles selection/management
 - Dashboard
 - Documents list
 - Create/Edit Document page
 - Customers page
 - Items page
 - Analytics dashboard
 - Subscription page / Welcome (renewal screen)

 UI requirements:
 - Form validations (numbers, GSTIN, phone formats where applicable)
 - Clear error and toast notifications
 - Smooth transitions and premium hover states

 ## 3.2 Hardware Interfaces
 Not applicable (browser application). Optional printing via OS printer dialog.

 ## 3.3 Software Interfaces
 - Backend REST API (Express)
 - MongoDB via Mongoose
 - JWT signing/verification
 - PDF export library (client-side)
 - Optional QR code generation (client-side)

 ## 3.4 Communications Interfaces
 - HTTPS/HTTP REST calls between frontend and backend
 - Headers used:
   - `Authorization: Bearer <token>`
   - `X-Device-ID: <deviceId>`
   - `X-Profile-ID: <profileId>` for profile-scoped requests

 # 4. System Features

 ## 4.1 User Authentication & Device Session Enforcement (High)

 ### 4.1.1 Description and Priority
 Users must authenticate via email/password. System enforces single-device session per user.

 ### 4.1.2 Stimulus/Response Sequences
 - User logs in -> server issues access token -> client stores token
 - User opens app again -> session is verified
 - If different device logs in -> previous device requests are blocked

 ### 4.1.3 Functional Requirements
 - **REQ-001:** System shall allow user signup with email/password.
 - **REQ-002:** System shall allow user login and return JWT access token.
 - **REQ-003:** System shall require `Authorization` header for protected endpoints.
 - **REQ-004:** System shall enforce single-device session using `X-Device-ID`.
 - **REQ-005:** If device mismatch is detected, server shall return 403 and client shall prompt re-login.

 ## 4.2 Subscription Validation (Online + Offline) (High)

 ### 4.2.1 Description and Priority
 System must prevent using paid features after subscription expiry, even offline, with protection against time tampering.

 ### 4.2.2 Stimulus/Response Sequences
 - Online validation:
   - Client calls `/subscription/validate` with `X-Profile-ID`
   - Server returns signed subscription token + server time
   - Client caches token per profile
 - Offline validation:
   - Client verifies signature offline
   - Client detects time rollback
   - Client enforces max offline duration (e.g., 7 days)
   - If invalid/expired -> block app -> redirect to `/welcome` + toast

 ### 4.2.3 Functional Requirements
 - **REQ-006:** System shall fetch subscription status online via `/subscription/validate`.
 - **REQ-007:** System shall return a signed subscription token containing:
   - profileId, endDate, iat, serverNow (srv), maxOffline window.
 - **REQ-008:** Client shall cache subscription token in localStorage per profile.
 - **REQ-009:** When offline, client shall validate subscription using cached token signature.
 - **REQ-010:** Client shall block access when subscription is expired.
 - **REQ-011:** Client shall block access if offline longer than max offline period.
 - **REQ-012:** Client shall detect device time rollback and block access with warning.
 - **REQ-013:** If cached token is tampered or invalid, client shall block and require internet.
 - **REQ-014:** If no cached token exists (first-time offline), system may allow limited access and must request online validation when possible.

 ## 4.3 Business Profile Management (High)

 ### 4.3.1 Description and Priority
 Users manage business profiles (business name, owner, GSTIN, bank/UPI details, etc.).

 ### 4.3.2 Stimulus/Response Sequences
 - User creates profile -> profile stored -> becomes selectable for work
 - User selects profile -> all documents/items/customers scoped to it

 ### 4.3.3 Functional Requirements
 - **REQ-015:** System shall allow user to create multiple business profiles.
 - **REQ-016:** System shall require `X-Profile-ID` for profile-scoped routes.
 - **REQ-017:** System shall allow editing profile details.
 - **REQ-018:** System shall isolate data by profile (customers/items/documents).

 ## 4.4 Customer Catalog (High)
 - **REQ-019:** System shall allow create/edit/list customers per profile.
 - **REQ-020:** System shall support customer name typeahead on document form.
 - **REQ-021:** Selecting a preset customer shall autofill relevant fields.

 ## 4.5 Item Catalog (High)
 - **REQ-022:** System shall allow create/edit/list items per profile.
 - **REQ-023:** Item shall support default discount percentage.
 - **REQ-024:** Document item input shall support item name typeahead.
 - **REQ-025:** Selecting preset item shall autofill item row fields.

 ## 4.6 Document Creation & Management (High)
 - **REQ-026:** System shall allow create/edit/view documents per profile.
 - **REQ-027:** System shall support document types: invoice, quotation, proforma, order, delivery challan, billing.
 - **REQ-028:** System shall auto-calculate item totals using quantity, rate, discount, and GST.
 - **REQ-029:** System shall support per-item currency selection and display symbols.
 - **REQ-030:** System shall support auto round-off toggle to make grand total a whole number.
 - **REQ-031:** System shall allow deleting an item row even if only one row remains (reset to blank row).
 - **REQ-032:** System shall store and load invoice-style metadata fields (invoice/challan/e-way/transport/place of supply, bank/UPI fields).

 ## 4.7 Analytics (Medium)
 - **REQ-033:** System shall provide sales totals, outstanding totals, top items, and monthly revenue charts.

 # 5. Other Nonfunctional Requirements

 ## 5.1 Performance Requirements
 - UI interactions should feel responsive (<200ms for typical input changes).
 - Document calculations should update totals immediately on field changes.

 ## 5.2 Safety Requirements
 Not applicable.

 ## 5.3 Security Requirements
 - JWT-based authentication for protected API routes.
 - Single-device session enforcement.
 - Subscription validation token must be signed and validated offline to prevent tampering.
 - Offline usage must be limited to a maximum period without revalidation.

 ## 5.4 Software Quality Attributes
 - Usability: clear form layout and fast data entry.
 - Reliability: avoid data loss; stable calculations.
 - Maintainability: modular UI components and REST APIs.
 - Portability: runs on modern browsers.

 ## 5.5 Business Rules
 - Subscription must be active to access write operations.
 - Read-only access may be allowed for certain endpoints (analytics/documents list) depending on server policy.
 - Payment mode field applies to proforma/order/billing/challan (not invoice).

 ## 5.6 Desktop (.exe) Distribution Key Storage (RS256)
 For an **.exe** build with a **hosted backend**, keys must be stored as follows:
 - **Private key (RS256 signing)**
   - Stored **only on the backend server**.
   - Never ship the private key inside the .exe.
   - Backend env:
     - `SUBSCRIPTION_JWT_PRIVATE_KEY_FILE` (recommended) or `SUBSCRIPTION_JWT_PRIVATE_KEY`
 - **Public key (RS256 verification)**
   - Safe to ship inside the .exe.
   - Bundled via frontend env:
     - `VITE_SUBSCRIPTION_JWT_PUBLIC_KEY`

 This enables:
 - Online token issuance by the server (`/subscription/validate`)
 - Offline verification by the .exe without exposing the signing key

# 6. Other Requirements
- Database requirements: MongoDB collections for users, sessions, subscriptions, profiles, documents, items, customers.
- Localization/currency support: INR/USD/EUR/GBP per item.

 # Appendix A: Glossary
 - **GST:** Goods and Services Tax
 - **SRS:** Software Requirements Specification
 - **JWT:** JSON Web Token
 - **Profile:** Business profile (business identity)

 # Appendix B: Analysis Models
 TBD (data flow diagrams, ER diagrams).

 # Appendix C: To Be Determined List
 1. Final list of supported export formats beyond PDF.
 2. Detailed role-based access control (if staff roles added).

 ## Running the code
 Run `npm i` to install dependencies.

 Run `npm run dev` to start the frontend.

 Backend (in `backend/`):
 - Run `npm i`
 - Run `npm run dev`