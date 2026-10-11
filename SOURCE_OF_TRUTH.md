# Online Internship and Placement Preparation Portal
## Project Source of Truth — Team Baseline

> **Purpose:** This file is the single source of truth for the team's SRS, Test Plan, Architecture & Design Specification, UML diagrams, APIs, and implementation.
>
> **Rule:** If a team member wants to add/change a feature, update this file first and check its impact on requirements, diagrams, APIs, implementation, and test cases.

---

## 1. Project Information

**Project Title:** Online Internship and Placement Preparation Portal

**Team Size:** 4

**Project Type:** Web-based Software Engineering Mini-Project

**Primary Goal:**
Provide students with a single platform to discover internship opportunities, apply for internships, take aptitude tests, track preparation progress, and view performance analysis.

---

## 2. Project Scope

### 2.1 In Scope

The system will provide:

1. Student registration and login
2. Internship listing and viewing
3. Internship search/filtering
4. Internship application
5. Aptitude tests
6. Test evaluation and score display
7. Progress tracking
8. Performance analysis
9. Admin management of internships
10. Admin management of aptitude tests/questions

### 2.2 Out of Scope

The following are not part of the current baseline unless the team explicitly adds them:

- Conducting actual company interviews
- Guaranteeing internship/placement selection
- Automatic hiring decisions
- Features requiring external company/recruiter access
- Any feature not documented in this source-of-truth file

---

## 3. Actors

### 3.1 Student

The student uses the portal to:

- Create an account
- Log in
- Browse internships
- Search/filter internships
- View internship details
- Apply for internships
- Take aptitude tests
- View test results
- Track preparation progress
- View performance analysis

### 3.2 Administrator

The administrator manages:

- Internship listings
- Aptitude tests
- Aptitude test questions
- Relevant system data

> **Note:** A Recruiter/Company actor is NOT part of the baseline unless the team later decides to implement recruiter functionality.

---

## 4. Core Modules

The system is divided into the following modules:

### M1 — Authentication
- Registration
- Login
- Authentication/authorization

### M2 — Internship Management
- View internships
- Search/filter internships
- View internship details
- Admin add/edit/delete internship listings

### M3 — Internship Application Management
- Submit internship application
- View application status/history
- Prevent invalid/duplicate applications where applicable

### M4 — Aptitude Test Management
- Display available tests
- Display questions
- Submit answers
- Evaluate test
- Store/display result
- Admin manage tests/questions

### M5 — Progress Tracking
- Record completed tests
- Record relevant student activities
- Display preparation progress

### M6 — Performance Analysis
- Analyze aptitude-test performance
- Display meaningful performance information to the student

### M7 — Admin Management
- Admin access
- Manage internship data
- Manage aptitude-test data/questions

---

# 5. Major User Flows

## 5.1 Student Flow

```text
Register / Login
       ↓
Student Dashboard
       ↓
 ┌───────────────┬────────────────┬────────────────┐
 ↓               ↓                ↓
Internships      Aptitude Tests   Progress
 ↓               ↓                ↓
View/Search      Take Test        View Progress
 ↓               ↓                ↓
Apply            View Score       Performance Analysis
```

## 5.2 Admin Flow

```text
Admin Login
     ↓
Admin Dashboard
     ↓
 ┌──────────────────────┬─────────────────────┐
 ↓                      ↓
Manage Internships      Manage Aptitude Tests
 ↓                      ↓
Add/Edit/Delete         Add/Edit/Delete
                        Questions
```

---

# 6. Functional Requirements

> **Requirement format:** Use clear, unambiguous, concise and testable statements. Each requirement receives a unique ID.

| ID | Functional Requirement | Module |
|---|---|---|
| FR-01 | The system shall allow a new student to register for an account. | M1 |
| FR-02 | The system shall allow a registered student to log in using valid credentials. | M1 |
| FR-03 | The system shall allow students to view available internship listings. | M2 |
| FR-04 | The system shall allow students to search/filter internship listings. | M2 |
| FR-05 | The system shall allow students to view the details of an internship. | M2 |
| FR-06 | The system shall allow a student to submit an application for an available internship. | M3 |
| FR-07 | The system shall allow students to view their internship application information. | M3 |
| FR-08 | The system shall allow students to view available aptitude tests. | M4 |
| FR-09 | The system shall allow students to take an aptitude test and submit their answers. | M4 |
| FR-10 | The system shall evaluate a submitted aptitude test and calculate the student's score. | M4 |
| FR-11 | The system shall allow students to view their aptitude-test results. | M4 |
| FR-12 | The system shall record relevant student preparation activities for progress tracking. | M5 |
| FR-13 | The system shall allow students to view their preparation progress. | M5 |
| FR-14 | The system shall provide performance analysis based on the student's aptitude-test results. | M6 |
| FR-15 | The system shall allow an administrator to add, update and remove internship listings. | M2/M7 |
| FR-16 | The system shall allow an administrator to create, update and remove aptitude tests/questions. | M4/M7 |

> **Important:** These are the baseline requirements. If the team changes a requirement, update the ID/table first and then update all dependent documents and diagrams.

---

# 7. Non-Functional Requirements

> Source: SRS v1.0 §5. These values are finalized and submitted.

| ID | Non-Functional Requirement | Category | Test |
|---|---|---|---|
| NFR-01 | For normal portal operations under the expected test load, the system shall return a successful user request within 3 seconds for at least 95% of measured requests. | Performance | TC-PERF-01 |
| NFR-02 | The system shall require authentication before access to student-specific applications, test results, progress, or performance information. | Security | TC-SEC-01 |
| NFR-03 | The system shall deny administrator functions to authenticated users without administrator authorization. | Security | TC-SEC-02 |
| NFR-04 | The system shall keep application and test-result records associated with the correct student and internship/test. | Data Integrity | TC-DATA-01 |
| NFR-05 | The system shall provide direct navigation from the student dashboard to internships, applications, aptitude tests, progress, and performance analysis. | Usability | TC-UX-01 |

---

# 8. Security Objectives

The project must contain at least two security objectives as required by the Software Engineering mini-project deliverables.

### SO-01 — Protect User Information
Protect student account, internship application and performance information from unauthorized access.

### SO-02 — Protect Authentication and Administrative Access
Ensure that only authenticated and authorized users can access protected student or administrative functionality.

---

# 9. Security Requirements

> Source: SRS v1.0 §5.1.2.

### SR-01 — Authentication · TC-SEC-01
The system shall require authentication before protected student-specific information is accessed.

### SR-02 — Authorization · TC-SEC-02
The system shall restrict administrative functions to authorized administrator accounts.

### SR-03 — Password Protection · TC-SEC-03
The system shall not store user passwords in plain text.

### SR-04 — Protected Student Data · TC-SEC-04
The system shall prevent a student from accessing another student's application, test-result, progress, or performance information through normal application functions.

### SR-05 — Backend/API Authorization · TC-SEC-05
The system shall validate authorization on protected backend/API operations, not only through frontend controls.

---

# 10. Initial Use Cases

The SRS must contain at least one UML use case diagram.

### Student Use Cases

- UC-01 Register
- UC-02 Login
- UC-03 View Internships
- UC-04 Search/Filter Internships
- UC-05 View Internship Details
- UC-06 Apply for Internship
- UC-07 View Applications
- UC-08 View Aptitude Tests
- UC-09 Take Aptitude Test
- UC-10 View Test Result
- UC-11 View Progress
- UC-12 View Performance Analysis

### Admin Use Cases

- UC-13 Manage Internship Listings
- UC-14 Manage Aptitude Tests
- UC-15 Manage Test Questions

---

# 11. Architecture Baseline

**Decided.** The implementation uses the following pinned technology stack (CLAUDE.md §2, ADR-07):

| Layer | Choice |
|---|---|
| Runtime | Node.js **22 LTS** (`.nvmrc` contains `22`) |
| Backend | Express **4.21.x**, CommonJS (`require`) |
| Database / ODM | MongoDB **7**, Mongoose **8.x** |
| Auth | `jsonwebtoken` 9.x, `bcryptjs` 2.4.x (salt rounds 10) |
| Validation | `zod` **3.x** (use `.strict()` on body schemas to reject unknown fields) |
| Security | `helmet` 8.x, `cors` 2.x, `express-rate-limit` 7.x |
| Server tests | `jest` 29.x, `supertest` 7.x, `mongodb-memory-server` 10.x, `cross-env` |
| Frontend | React **18**, Vite **5**, `react-router-dom` **6**, `axios` 1.x |
| Charts | `recharts` 2.x (analysis charts only) |
| Client tests | `vitest` 2.x, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` |
| Styling | Plain CSS with design tokens in `client/src/styles/global.css` (no Tailwind, no UI kits) |
| Analysis | Implemented inside Node.js — **no Python** (ADR-07) |
| CI | GitHub Actions (`.github/workflows/ci.yml`) |

**Architecture pattern:** Three-layer modular monolith (SAD §3.5).

```text
+----------------------------------+
|       Student / Admin (Browser)  |
+----------------+-----------------+
                 |
                 v
+----------------------------------+
| Presentation Layer               |
| React 18 SPA (Vite)              |
+----------------+-----------------+
                 |
                 v (HTTPS JSON /api)
+----------------------------------+
| Application / API Layer          |
| Node.js 22 + Express 4           |
| Modules M1-M7 (modular monolith) |
| Analysis runs here - no Python   |
+----------------+-----------------+
                 |
                 v
+----------------------------------+
| Data Layer                       |
| MongoDB 7 via Mongoose 8         |
+----------------------------------+
```

> **Architecture rule:** The browser never talks to the database directly. Analysis is implemented in Node.js; there is no separate Python service (ADR-07).

---

# 12. Architecture Components

The initial component-level breakdown is:

1. **Authentication Component**
2. **Internship Management Component**
3. **Application Management Component**
4. **Aptitude Test Component**
5. **Progress Tracking Component**
6. **Performance Analysis Component**
7. **Admin Management Component**
8. **Database**
9. **Frontend/UI**
10. **Backend/API Layer**

The final component diagram must show the actual relationships between these components.

---

# 13. Architecture Pattern

**Decided.** The system uses a **three-layer modular monolith** (SAD §3.5):

```text
Presentation Layer  (React 18 SPA)
       ↓
Application / API Layer  (Node.js 22 + Express 4, modules M1-M7)
       ↓
Data Layer  (MongoDB 7 via Mongoose 8)
```

All modules (M1-M7) run within a single Express process. Each module owns its own routes, controller, service, and schema files; services contain all business rules (controllers never touch models directly). This matches SAD §4.1.

---

# 14. Required UML Diagrams

The project deliverables require:

### 14.1 Use Case Diagram
At least **1**.

Actors:
- Student
- Admin

### 14.2 Sequence Diagrams
At least **2**.

Recommended baseline:

**Sequence Diagram 1 — Internship Application**

```text
Student
   ↓
Frontend
   ↓
Backend/API
   ↓
Database
   ↓
Backend/API
   ↓
Frontend
   ↓
Student
```

**Sequence Diagram 2 — Aptitude Test**

```text
Student
   ↓
Frontend
   ↓
Backend/API
   ↓
Database
   ↓
Backend/API
   ↓
Frontend
   ↓
Student
```

---

# 15. API Design

> **Decided.** Endpoint names and access rules below are final and match CLAUDE.md §6 (SAD §4.3). Base path `/api`, JSON only. `✱` marks endpoints added beyond the initial baseline (see `docs/DEVIATIONS.md` for deviation entries).

| Method | Endpoint | Access | Requirement | Notes |
|---|---|---|---|---|
| GET | `/api/health` | Public | NFR-01 | `{ status, db }` — health probe |
| POST | `/api/register` | Public | FR-01 | Create student account; always creates `role:'student'` |
| POST | `/api/login` | Public | FR-02 | Returns `{ token, role, name, expiresIn }` |
| GET | `/api/internships` | Student, Admin | FR-03, FR-04 | Search/filter by `search`, `category`, `location`; paginated; sorted by deadline asc |
| GET | `/api/internships/meta` ✱ | Student, Admin | FR-04 | `{ categories, locations }` for filter dropdowns (deviation D-03) |
| GET | `/api/internships/:id` | Student, Admin | FR-05 | Full internship + `hasApplied` for students |
| POST | `/api/applications` | Student | FR-06, NFR-04, FR-12 | Validates open/deadline; prevents duplicates; records activity |
| GET | `/api/applications` | Student | FR-07, SR-04 | Caller's records only, newest first |
| GET | `/api/tests` | Student | FR-08 | Tests with >= 1 question; includes `questionCount`, `totalMarks`, `attempts` |
| GET | `/api/tests/:id` | Student | FR-09 | Questions without `correctOption` |
| POST | `/api/tests/:id/submit` | Student | FR-09, FR-10, FR-12 | Server-side scoring; saves Result; records activity |
| GET | `/api/results` | Student | FR-11 | All caller's results, newest first |
| GET | `/api/results/:id` | Student | FR-11, SR-04 | Detail view; other student's result -> 404 |
| GET | `/api/progress` | Student | FR-13 | Progress summary + last-10 activities |
| GET | `/api/analysis` | Student | FR-14 | Aggregated performance metrics (see §22) |
| GET | `/api/admin/tests` ✱ | Admin | FR-16 | All tests with `questionCount` (deviation D-04) |
| GET | `/api/admin/tests/:id` ✱ | Admin | FR-16 | Test + questions including `correctOption` (deviation D-04) |
| POST | `/api/admin/internships` | Admin | FR-15 | Create internship |
| PUT | `/api/admin/internships/:id` | Admin | FR-15 | Partial update; 404 if not found |
| DELETE | `/api/admin/internships/:id` | Admin | FR-15 | Deletes internship and its applications |
| POST | `/api/admin/tests` | Admin | FR-16 | Create test |
| PUT | `/api/admin/tests/:id` | Admin | FR-16 | Partial update; 404 if not found |
| DELETE | `/api/admin/tests/:id` | Admin | FR-16 | Deletes test and questions; Results kept for history |
| POST | `/api/admin/tests/:id/questions` | Admin | FR-16 | Add question to test |
| PUT | `/api/admin/questions/:qid` | Admin | FR-16 | Partial update; re-validates `correctOption` |
| DELETE | `/api/admin/questions/:qid` | Admin | FR-16 | Remove question |

All `/api/admin/*` routes require `authenticate, authorize('admin')`. Student-only routes require `authenticate, authorize('student')`. Internship read routes require `authenticate` only.

---

# 16. Error Handling Baseline

The system should handle at least:

- Invalid login credentials
- Missing/invalid registration information
- Internship not found
- Invalid internship application
- Duplicate application, if applicable
- Invalid test submission
- Unauthorized access
- Admin-only function accessed by a student
- Database/server failure
- Invalid API request

General rule:

```text
Error occurs
    ↓
Backend identifies/handles error
    ↓
Appropriate response returned
    ↓
Frontend displays clear user-facing message
```

The system should not expose sensitive internal/server information to normal users.

---

# 17. Test Plan Baseline

The Test Plan must be linked to the SRS requirements.

The project requires functional and non-functional testing, security validation and traceability.

### Final Test Case Mapping

| Test ID | Requirement | Test Case Description | Scope / Preconditions |
|---|---|---|---|
| TC-AUTH-01 | FR-01 | Verify student registration with valid and invalid information | Student registration; clear rejection on invalid/missing fields |
| TC-AUTH-02 | FR-02 | Verify student and administrator login with valid and invalid credentials; verify unauthenticated access to protected pages is denied | Valid logins succeed; invalid credentials rejected; protected pages denied |
| TC-INT-01 | FR-03 | Verify available internship listings display to authenticated students | Active internship listings rendered correctly |
| TC-INT-02 | FR-04 | Verify searching and filtering internships using supported criteria | Search by title/company, category filter, location filter; empty search handled |
| TC-INT-03 | FR-05 | Verify internship details display for a selected listing | Stored details and application status rendered |
| TC-APP-01 | FR-06 | Verify internship application submission for an available internship | Authenticated student applies; duplicate applications prevented |
| TC-APP-02 | FR-07 | Verify student can view their submitted internship applications | Caller's applications only; shows correct status and internship info |
| TC-TEST-01 | FR-08 | Verify available aptitude tests display to students | Tests with >= 1 question listed with counts and marks |
| TC-TEST-02 | FR-09 | Verify taking an aptitude test and submitting answers | One question at a time; options without correct answer exposed |
| TC-TEST-03 | FR-10 | Verify test evaluation and server-side score calculation | Score, percentage, and category breakdown calculated on server |
| TC-TEST-04 | FR-11 | Verify student can view their aptitude-test results and result detail | List of attempts; individual result breakdown with category scores |
| TC-PROG-01 | FR-12 | Verify student preparation activities are recorded | Activities recorded for test completions and internship applications |
| TC-PROG-02 | FR-13 | Verify student preparation progress and recent activity display | Available vs completed tests, attempt counts, recent 10 activities |
| TC-PERF-01 | FR-14, NFR-01 | Verify performance analysis display and portal response-time target | Aggregated metrics, trend, category accuracy; >= 95% of requests complete within 3 seconds |
| TC-ADM-01 | FR-15 | Verify administrator can add, update, and remove internship listings | Admin CRUD operations on internships; cascade delete of applications |
| TC-ADM-02 | FR-16 | Verify administrator can manage aptitude tests and questions | Admin CRUD for tests and questions; viewing full details including correctOption |
| TC-SEC-01 | SR-01, NFR-02 | Verify authentication required before accessing student-specific information | Unauthenticated access rejected with 401 UNAUTHORIZED |
| TC-SEC-02 | SR-02, NFR-03 | Verify administrator functions are restricted to authorized administrators | Student accounts denied admin routes with 403 FORBIDDEN_ADMIN_ONLY |
| TC-SEC-03 | SR-03 | Verify user passwords are not stored or returned in plain text | Passwords hashed with bcryptjs (10 rounds); never selected or returned |
| TC-SEC-04 | SR-04 | Verify students cannot access other students' applications, results, or data | Student identity taken strictly from verified JWT; foreign records 404 |
| TC-SEC-05 | SR-05 | Verify backend/API authorization enforcement independently of frontend controls | Direct API calls without valid token or role are rejected |
| TC-DATA-01 | NFR-04 | Verify data integrity for applications and test results | Unique compound index prevents duplicates; results recorded once |
| TC-UX-01 | NFR-05 | Verify direct dashboard navigation to all key student modules | Internships, applications, aptitude tests, progress, and performance analysis reachable |

> **Note on NFR-01:** `CLAUDE.md` uses `NFR-01` as the identifier for the automated performance measurement script (`server/scripts/perf-test.js`), while the SRS and Test Plan map requirement NFR-01 to test case `TC-PERF-01`. Both references describe the same 3-second / 95% response-time target.

---

# 18. Traceability Baseline

Every major requirement should eventually connect to:

```text
Requirement
    ↓
Use Case
    ↓
Architecture Component
    ↓
API / Design
    ↓
Test Case
```

Example:

```text
FR-06
Student can apply for internship
        ↓
UC-06
Apply for Internship
        ↓
Application Management Component
        ↓
POST /api/applications
        ↓
Internship Application Sequence Diagram
        ↓
TC-APP-01
```

---

# 19. Security Traceability

| Security Objective | Security Requirement | Validation |
|---|---|---|
| SO-01 Protect user information | SR-03 Password protection | TC-SEC-03 |
| SO-01 Protect user information | SR-04 Protected student data | TC-SEC-04 |
| SO-02 Protect authentication/admin access | SR-01 Authentication | TC-SEC-01 |
| SO-02 Protect authentication/admin access | SR-02 Authorization | TC-SEC-02 |
| SO-02 Protect authentication/admin access | SR-05 Backend/API authorization | TC-SEC-05 |

---

# 20. Team Responsibilities

## Member 1 — SRS & Requirements Lead

Responsible for:

- Project scope
- Actors
- Modules
- Functional requirements
- Non-functional requirements
- Security objectives/requirements
- SRS Introduction
- SRS Overall Description
- SRS requirements section
- Maintaining this source-of-truth file

## Member 2 — Test Plan Lead

Responsible for:

- Test Plan
- Functional testing
- Non-functional testing
- Security validation
- Test cases
- SRS-to-test traceability

## Member 3 — Architecture & Design Lead

Responsible for:

- Architecture
- Architecture pattern
- Component diagram
- Component descriptions
- Security architecture
- Sequence diagrams
- API design
- Error handling
- Architecture-to-requirement traceability

## Member 4 — UML, Security & Integration Lead

Responsible for:

- Use Case Diagram
- Supporting sequence diagrams
- Security documentation
- Diagram consistency
- Cross-document traceability
- Final document consistency/formatting
- Checking that all documents describe the same system

---

# 21. Rules for Team Changes

Before adding a new feature, answer:

1. Does it change the project scope?
2. Does it require a new functional requirement?
3. Does it change any NFR/security requirement?
4. Does it require a new use case?
5. Does it change the architecture?
6. Does it require a new API?
7. Does it require a new sequence/component diagram?
8. Does it require new test cases?
9. Does it affect existing traceability?

If yes, update this file first.

---

# 22. Current Decisions vs. Decisions Still To Finalize

## Already defined

- Project title
- Student and Admin as baseline actors
- Internship listings
- Internship applications
- Aptitude tests
- Progress tracking
- Performance analysis
- Security requirements
- Required IEEE deliverables
- Initial requirement IDs
- Initial test-case mapping
- **Technology stack and versions:** React 18 + Vite 5 (frontend); Node.js 22 LTS + Express 4.21.x (backend); MongoDB 7 + Mongoose 8.x (database) — see CLAUDE.md §2.
- **Database schema:** Exact fields and indexes as specified in CLAUDE.md §5 (User, Internship, Application, Test, Question, Result, Activity).
- **NFR-01 target:** 95% of requests complete within 3 seconds under normal operating conditions.
- **Supported browsers:** Current and previous stable versions of Chrome, Edge, and Firefox.
- **Authentication implementation:** JWT (`jsonwebtoken` 9.x) and bcrypt (`bcryptjs` 2.4.x, 10 rounds).
- **Application status visible to students:** `"Submitted"` only (Application.status enum contains only `'Submitted'`).
- **Performance-analysis metrics:** average percentage, best percentage, latest percentage; per-category accuracy (correct marks / total marks × 100); strongest and weakest categories (ties broken alphabetically); chronological trend (last 20 results).
- **Admin capabilities:** FR-15 (manage internship listings) and FR-16 (manage aptitude tests and questions) only.
- **No Python:** Analysis is implemented entirely in Node.js (ADR-07); there is no separate Python service.
- **API endpoints:** Finalized — see §15.
- **Architecture pattern:** Three-layer modular monolith — see §11 and §13.

## Still to finalize

- Any additional features the team decides to add (must follow the change process in §21).

---

# 23. Deliverables Checklist

### Document 1 — SRS

- [ ] IEEE structure
- [ ] Introduction
- [ ] Purpose
- [ ] Scope
- [ ] Definitions/acronyms
- [ ] References
- [ ] Overview
- [ ] Product perspective
- [ ] Product functions
- [ ] User characteristics
- [ ] Constraints
- [ ] Assumptions/dependencies
- [ ] External interfaces
- [ ] Functional requirements
- [ ] Non-functional requirements
- [ ] Design constraints
- [ ] Use Case Diagram
- [ ] Security objectives
- [ ] Security requirements

### Document 2 — Test Plan

- [ ] IEEE structure
- [ ] Introduction/descriptive sections
- [ ] Required Sections 3, 4 and 5
- [ ] Security validation
- [ ] SRS traceability
- [ ] Functional test cases
- [ ] Non-functional test cases
- [ ] At least 7–10 test cases

### Document 3 — Software Architecture & Design Specification

- [ ] Architecture
- [ ] Component Diagram
- [ ] Component descriptions
- [ ] Architecture pattern
- [ ] Architecture traceability
- [ ] Security architecture
- [ ] Sequence Diagram 1
- [ ] Sequence Diagram 2
- [ ] API design
- [ ] Error handling
- [ ] Other required IEEE sections

---

## 24. Golden Rule

> **The SRS defines WHAT the system must do.**
>
> **The Architecture & Design document defines HOW the system is organized to do it.**
>
> **The Test Plan defines HOW we verify that it does it.**
>
> **Traceability connects all three.**

**This file is the baseline. Change the baseline first; then change the documents/code/diagrams/tests.**

---

# 25. Change Log

| Date | Summary |
|---|---|
| 12-10-2026 | **Full requirements baseline and traceability alignment.** §7 updated with exact submitted SRS v1.0 §5 NFRs (NFR-01..05) and measurable 3-second/95% target, removing obsolete NFR-06..08. §9 updated with complete SR-01..05 including backend authorization enforcement (SR-05) and test mappings. §11 updated with complete pinned stack from CLAUDE.md §2, three-layer modular monolith architecture, and Node.js-only analysis (no Python, ADR-07). §15 updated to full 26-endpoint API table with ✱ marks for additional endpoints (meta and admin test detail). §17 replaced preliminary TC-01..10 with final named test IDs (TC-AUTH, TC-INT, TC-APP, TC-TEST, TC-PROG, TC-PERF, TC-ADM, TC-SEC, TC-DATA, TC-UX) from SRS and Test Plan V2. §18 updated application traceability example to TC-APP-01. §19 mapped security requirements to TC-SEC-01..05. §22 moved all confirmed technical decisions into "Already defined". |
