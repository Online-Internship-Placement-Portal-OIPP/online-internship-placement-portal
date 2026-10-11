# OIPP — Master Build Specification (read this before writing ANY code)

> This file is the contract for every AI coding assistant (Claude Code, GitHub Copilot, Cursor, ChatGPT…) and every team member working on this repository.
> It is derived from our submitted Deliverable-1 documents: **SRS v1.0**, **Software Test Plan v2**, **Software Architecture & Design Specification (SAD) v1.2** and the **Source of Truth**.
> If the code must differ from those documents, do NOT silently change it — add an entry to `docs/DEVIATIONS.md` in the same PR.

---

## 0. Rules for the AI assistant (follow strictly)

1. **Stay inside the story.** Only create/modify the files listed in the story prompt you were given. If you believe another file must change, say so and explain why before touching it.
2. **Never invent new endpoints, fields, error codes or libraries.** Use exactly what is in this file. If something is missing, stop and ask.
3. **Every protected rule is enforced on the server** (SR-05). Frontend checks are convenience only.
4. **Student identity always comes from the verified JWT (`req.user.id`)** — never from the request body, query or params (SR-04, R-01).
5. **Never return** `passwordHash`, `correctOption`, stack traces or raw database errors to the client.
6. **Every story ships with tests** named after the Test Plan IDs (e.g. `describe('TC-APP-01 …')`). `npm test` in `server/` and `npm run build` + `npm test` in `client/` must pass before the PR is opened.
7. **Code must run on Windows, macOS and Linux** (use `bcryptjs`, not native `bcrypt`; use `cross-env` for env vars in npm scripts; no shell-specific scripts).
8. **No secrets in git.** Only `.env.example` is committed.
9. Write clean, commented, beginner-readable code. Small functions. No dead code. No `console.log` left behind except through `utils/logger.js`.
10. When finished, print: the list of files changed, how to run/verify the feature manually, and the test results.

---

## 1. Project summary

**Online Internship and Placement Preparation Portal (OIPP).** Students register, log in, browse/search internships, apply, take aptitude tests (scored on the server), view results, track preparation progress and see performance analysis. Administrators manage internships, aptitude tests and questions.

**Actors:** Student, Administrator. **No recruiter/company actor. No Python service** (analysis runs inside Node.js — ADR-07).

**Architecture (SAD §3.5):** three-layer — Presentation (React SPA) → Application/API (Node.js + Express, modular monolith with modules M1–M7) → Data (MongoDB via Mongoose). The browser never talks to the database.

| Module | Name | Requirements |
|---|---|---|
| M1 | Authentication | FR-01, FR-02, SR-01, SR-02, SR-03, SR-05 |
| M2 | Internship Management | FR-03, FR-04, FR-05 |
| M3 | Application Management | FR-06, FR-07, NFR-04, SR-04 |
| M4 | Aptitude Test Management | FR-08, FR-09, FR-10, FR-11 |
| M5 | Progress Tracking | FR-12, FR-13 |
| M6 | Performance Analysis | FR-14 |
| M7 | Admin Management | FR-15, FR-16, NFR-03 |

---

## 2. Technology stack (pinned — do not change)

| Layer | Choice |
|---|---|
| Runtime | Node.js **22 LTS** (`.nvmrc` contains `22`) |
| Backend | Express **4.21.x**, CommonJS (`require`) |
| DB / ODM | MongoDB 7 (local Community Server or Atlas free tier), Mongoose **8.x** |
| Auth | `jsonwebtoken` 9.x, `bcryptjs` 2.4.x (salt rounds 10) |
| Validation | `zod` **3.x** (use `.strict()` on body schemas to reject unknown fields) |
| Security | `helmet` 8.x, `cors` 2.x, `express-rate-limit` 7.x |
| Server tests | `jest` 29.x, `supertest` 7.x, `mongodb-memory-server` 10.x, `cross-env` |
| Frontend | React **18**, Vite **5**, `react-router-dom` **6**, `axios` 1.x, `recharts` 2.x (analysis charts only) |
| Client tests | `vitest` 2.x, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` |
| Styling | Plain CSS with design tokens in `client/src/styles/global.css` (no Tailwind, no UI kits) |
| CI | GitHub Actions (`.github/workflows/ci.yml`) |

---

## 3. Repository layout

```
/
├── CLAUDE.md                     # this file (copied to AGENTS.md and .github/copilot-instructions.md)
├── SOURCE_OF_TRUTH.md
├── README.md                     # how to install, seed, run, test
├── CONTRIBUTING.md               # branch / commit / PR rules
├── .nvmrc                        # 22
├── package.json                  # root scripts only (dev, test, seed) using concurrently
├── Deliverable-1/                # submitted documents (do not modify)
├── docs/
│   ├── DEVIATIONS.md             # every difference from SRS/SAD/Test Plan
│   ├── SECURITY_VALIDATION.md    # Test Plan §5.1 results
│   ├── TEST_EXECUTION_REPORT.md  # actual results per TC id
│   ├── api/OIPP.postman_collection.json
│   └── sprint-videos/            # sprint1-demo.mp4, sprint2-demo.mp4 (< 50 MB each)
├── .github/
│   ├── workflows/ci.yml
│   ├── workflows/pr-automation.yml
│   ├── labeler.yml
│   ├── pull_request_template.md
│   └── copilot-instructions.md
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── jest.config.js
│   ├── scripts/seed.js
│   ├── scripts/perf-test.js      # NFR-01 measurement
│   ├── src/
│   │   ├── server.js             # connects DB, starts listening
│   │   ├── app.js                # builds and exports the Express app (no listen) – used by tests
│   │   ├── config/env.js         # reads + validates env vars
│   │   ├── config/db.js          # connect/disconnect helpers
│   │   ├── models/               # User, Internship, Application, Test, Question, Result, Activity
│   │   ├── middleware/
│   │   │   ├── auth.js           # authenticate, authorize(role)
│   │   │   ├── validate.js       # validate({ body, query, params }) with zod
│   │   │   ├── security.js       # helmet, cors, body limit, rate limiters
│   │   │   ├── requestLogger.js  # request id + timing log
│   │   │   ├── notFound.js
│   │   │   └── errorHandler.js
│   │   ├── utils/
│   │   │   ├── AppError.js
│   │   │   ├── errors.js         # ERROR catalogue (§7)
│   │   │   ├── asyncHandler.js
│   │   │   ├── respond.js        # ok(res, data, status=200)
│   │   │   ├── objectId.js       # zod schema + helper for valid ObjectIds
│   │   │   ├── escapeRegex.js
│   │   │   └── logger.js
│   │   └── modules/
│   │       ├── auth/             auth.routes.js, auth.controller.js, auth.service.js, auth.schemas.js
│   │       ├── internships/      internships.routes.js, .controller.js, .service.js (read),
│   │       │                     internships.admin.service.js (write, used by M7), internships.schemas.js
│   │       ├── applications/     applications.routes.js, .controller.js, .service.js, .schemas.js
│   │       ├── aptitude/         aptitude.routes.js (/tests, /results), .controller.js, .service.js,
│   │       │                     aptitude.admin.service.js (write, used by M7), aptitude.schemas.js
│   │       ├── progress/         activity.service.js (recordActivity), progress.routes.js, .controller.js, .service.js
│   │       ├── analysis/         analysis.routes.js, .controller.js, .service.js
│   │       └── admin/            admin.routes.js, admin.controller.js, admin.schemas.js
│   └── tests/
│       ├── setup.js              # DB lifecycle for every test file
│       ├── helpers.js            # createStudent, createAdmin, authHeader, createInternship, createTestWithQuestions
│       └── *.test.js             # one file per area, describe blocks named by TC id
└── client/
    ├── package.json
    ├── vite.config.js            # proxy /api -> http://localhost:5000, vitest config (jsdom)
    ├── index.html
    └── src/
        ├── main.jsx, App.jsx     # routes (§9)
        ├── api/client.js         # axios instance + interceptors
        ├── api/*.js              # one file per module: authApi, internshipsApi, applicationsApi, testsApi, progressApi, analysisApi, adminApi
        ├── context/AuthContext.jsx
        ├── components/           # Navbar, ProtectedRoute, Alert, Loader, EmptyState, Pagination, ConfirmDialog, FormField
        ├── pages/                # one file per screen (§9)
        ├── pages/admin/
        ├── styles/global.css
        └── test/setup.js
```

Each backend module follows **routes → controller → service → model** (SAD §4.1). Controllers never touch models directly; services contain all business rules.

---

## 4. Environment variables (`server/.env.example`)

```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/oipp
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=3600
CLIENT_ORIGIN=http://localhost:5173
```

`config/env.js` throws a clear startup error if `MONGODB_URI` or `JWT_SECRET` is missing (except when `NODE_ENV=test`, where tests provide them).

---

## 5. Data model (Mongoose — exact fields; SAD §3.6.1)

All schemas use `{ timestamps: true }` unless stated. Use `toJSON` transform to expose `id` (string) instead of `_id` and remove `__v`.

**User** — `name` String required trim 2–80; `email` String required unique lowercase trim; `passwordHash` String required `select: false`; `role` enum `['student','admin']` default `'student'`.

**Internship** — `title` String required trim 2–120; `company` String required trim 2–120; `location` String required trim; `category` String required trim; `description` String required 10–5000; `deadline` Date required; `status` enum `['open','closed']` default `'open'`. Indexes: `{ category: 1 }`, `{ location: 1 }`, `{ status: 1, deadline: 1 }`.

**Application** — `studentId` ObjectId ref User required; `internshipId` ObjectId ref Internship required; `status` enum `['Submitted']` default `'Submitted'`; `appliedAt` Date default now. **Unique compound index `{ studentId: 1, internshipId: 1 }`** (NFR-04).

**Test** — `title` String required 2–120; `category` String required; `description` String optional max 1000; `durationMinutes` Number required min 1 max 180.

**Question** — `testId` ObjectId ref Test required, indexed; `text` String required 5–1000; `options` [String] required, length 2–6, each non-empty; `correctOption` Number required (0-based index, must be < options.length) **`select: false`**; `category` String required (e.g. `Quantitative`, `Logical`, `Verbal`); `marks` Number default 1 min 1 max 10.

**Result** — `studentId` ObjectId ref User required; `testId` ObjectId ref Test required; `score` Number; `totalMarks` Number; `percentage` Number (0–100, integer); `categoryScores` [{ `category` String, `score` Number, `total` Number }]; `submittedAt` Date default now. Index `{ studentId: 1, submittedAt: -1 }`. Written exactly once per submission; never updated by students.

**Activity** — `studentId` ObjectId ref User required; `type` enum `['TEST_COMPLETED','INTERNSHIP_APPLIED']`; `refId` ObjectId required; `createdAt` (timestamps). Index `{ studentId: 1, createdAt: -1 }`.

Admin accounts are created **only** by the seed script / database — registration always creates `role: 'student'` (STRIDE: elevation of privilege).

---

## 6. API contract (SAD §4.3 — base path `/api`, JSON only)

**Success envelope:** `{ "success": true, "data": … }`
**Error envelope:** `{ "success": false, "error": { "code": "…", "message": "…", "details": [ { "field": "email", "message": "…" } ] } }` (`details` only for `VALIDATION_ERROR`).
**Auth header:** `Authorization: Bearer <JWT>`. JWT payload `{ sub: <userId>, role }`, signed with `JWT_SECRET`, `expiresIn: JWT_EXPIRES_IN` seconds. `authenticate` sets `req.user = { id, role }`.
**Pagination:** `page` (default 1, min 1), `limit` (default 10, min 1, max 50). Paginated responses: `{ items, page, limit, total }`.

| Method | Endpoint | Access | Req | Behaviour / response `data` |
|---|---|---|---|---|
| GET | `/api/health` | Public | NFR-01 | `{ status: 'ok', db: 'up' \| 'down' }` |
| POST | `/api/register` | Public | FR-01 | body `{ name, email, password }` (name 2–80 chars, valid email, password 8–72 chars). 201 `{ userId, name, email, role:'student' }`. Errors: 400 VALIDATION_ERROR, 409 EMAIL_EXISTS |
| POST | `/api/login` | Public | FR-02 | body `{ email, password }`. 200 `{ token, role, name, expiresIn }`. Same 401 INVALID_CREDENTIALS for unknown email and wrong password |
| GET | `/api/internships` | Student, Admin | FR-03, FR-04 | query `search` (case-insensitive, regex-escaped, matches title OR company), `category` (exact, case-insensitive), `location` (partial, case-insensitive), `page`, `limit`. Students see only `status:'open'`; admins see all. Sorted by `deadline` asc. Paginated items `{ id, title, company, location, category, deadline, status }` |
| GET | `/api/internships/meta` | Student, Admin | FR-04 | `{ categories: [...distinct], locations: [...distinct] }` for filter dropdowns (✱ deviation D-03) |
| GET | `/api/internships/:id` | Student, Admin | FR-05 | full internship + `hasApplied` (boolean, students only). 400 INVALID_REQUEST bad id, 404 INTERNSHIP_NOT_FOUND (students also get 404 for closed ones) |
| POST | `/api/applications` | Student | FR-06, NFR-04, FR-12 | body `{ internshipId }`. Checks internship exists (404), is open and deadline not passed (400 INVALID_APPLICATION), not already applied (409 DUPLICATE_APPLICATION — check first AND catch Mongo error 11000). Then `recordActivity(student,'INTERNSHIP_APPLIED',internshipId)`. 201 `{ applicationId, internshipId, status, appliedAt }` |
| GET | `/api/applications` | Student | FR-07, SR-04 | array (newest first) `{ applicationId, internshipId, internshipTitle, company, location, status, appliedAt }` — only the caller's records. Deleted internships show `internshipTitle: 'Internship removed'` |
| GET | `/api/tests` | Student | FR-08 | array of tests that have ≥ 1 question: `{ id, title, category, description, durationMinutes, questionCount, totalMarks, attempts }` (`attempts` = caller's result count for that test) |
| GET | `/api/tests/:id` | Student | FR-09 | `{ id, title, category, durationMinutes, questions: [ { id, text, options, category, marks } ] }` — **never includes correctOption**. 404 TEST_NOT_FOUND (also if it has no questions) |
| POST | `/api/tests/:id/submit` | Student | FR-09, FR-10, FR-12 | body `{ answers: [ { questionId, selectedOption } ] }`. Rules: every questionId must belong to the test, no duplicates, `selectedOption` integer in `[0, options.length-1]` → else 400 INVALID_SUBMISSION. Unanswered questions score 0. Server loads correct answers with `.select('+correctOption')`, computes `score` (sum of marks of correct answers), `totalMarks` (sum of all marks in the test), `percentage = Math.round(score/totalMarks*100)`, `categoryScores` grouped by question category. Saves ONE Result, then `recordActivity(student,'TEST_COMPLETED',testId)`. Retakes allowed (each creates a new Result). 200 `{ resultId, testId, score, totalMarks, percentage, categoryScores }` |
| GET | `/api/results` | Student | FR-11 | array newest first `{ resultId, testId, testTitle, score, totalMarks, percentage, submittedAt }` (deleted test → `testTitle: 'Test removed'`) |
| GET | `/api/results/:id` | Student | FR-11, SR-04 | `{ resultId, testId, testTitle, score, totalMarks, percentage, categoryScores, submittedAt }`. Another student's result → **404 RESULT_NOT_FOUND** (do not reveal existence) |
| GET | `/api/progress` | Student | FR-13 | `{ testsAvailable, testsCompleted (distinct tests with ≥1 result), totalAttempts, applicationsSubmitted, completionPercentage (round(testsCompleted/testsAvailable*100), 0 if none), recentActivities: [ { type, refId, label, at } ] (latest 10; label = test/internship title or 'Removed item') }` |
| GET | `/api/analysis` | Student | FR-14 | If no results: `{ attempts: 0, message: 'Take your first aptitude test to see your performance analysis.' }`. Else `{ attempts, averagePercentage, bestPercentage, latestPercentage, categoryPerformance: [ { category, correctMarks, totalMarks, accuracy } ], strongestCategory, weakestCategory, trend: [ { date (YYYY-MM-DD), testTitle, percentage } ] (chronological, last 20 results) }`. Accuracy = round(sum score / sum total × 100) across all results' categoryScores. Strongest/weakest = highest/lowest accuracy (ties → alphabetical); if only one category, both are that category |
| GET | `/api/admin/tests` | Admin | FR-16 | all tests with `questionCount` (✱ deviation D-04) |
| GET | `/api/admin/tests/:id` | Admin | FR-16 | test + all questions **including correctOption** (admin only, ✱ deviation D-04) |
| POST | `/api/admin/internships` | Admin | FR-15 | body `{ title, company, location, category, description, deadline (ISO date, must be today or later), status? }` → 201 internship |
| PUT | `/api/admin/internships/:id` | Admin | FR-15 | partial update (same validation, at least one field) → 200 internship; 404 INTERNSHIP_NOT_FOUND |
| DELETE | `/api/admin/internships/:id` | Admin | FR-15 | deletes the internship **and its applications** (keeps data consistent, NFR-04) → 200 `{ deleted: true, id }` |
| POST | `/api/admin/tests` | Admin | FR-16 | `{ title, category, description?, durationMinutes }` → 201 |
| PUT | `/api/admin/tests/:id` | Admin | FR-16 | partial update → 200; 404 TEST_NOT_FOUND |
| DELETE | `/api/admin/tests/:id` | Admin | FR-16 | deletes the test and its questions; existing Results are kept for history → 200 `{ deleted: true, id }` |
| POST | `/api/admin/tests/:id/questions` | Admin | FR-16 | `{ text, options[2..6], correctOption, category, marks? }` (correctOption < options.length) → 201 question (incl. correctOption) |
| PUT | `/api/admin/questions/:qid` | Admin | FR-16 | partial update; re-validate correctOption against final options → 200; 404 QUESTION_NOT_FOUND |
| DELETE | `/api/admin/questions/:qid` | Admin | FR-16 | → 200 `{ deleted: true, id }` |

Every `/api/admin/*` route uses `authenticate, authorize('admin')`. Every student route uses `authenticate, authorize('student')`. Internship read routes use `authenticate` only.
Admin write actions are logged at `info` with the admin's user id (SAD §4.4.3).

---

## 7. Error catalogue (`server/src/utils/errors.js` — SAD §4.4.2)

| Code | HTTP | User-facing message |
|---|---|---|
| VALIDATION_ERROR | 400 | Please correct the highlighted fields. |
| INVALID_REQUEST | 400 | The request could not be understood. |
| INVALID_APPLICATION | 400 | This application cannot be submitted. |
| INVALID_SUBMISSION | 400 | Your answers could not be submitted. Please try again. |
| INVALID_CREDENTIALS | 401 | Invalid email or password. |
| UNAUTHORIZED | 401 | Please log in to continue. |
| FORBIDDEN | 403 | You do not have permission to perform this action. |
| FORBIDDEN_ADMIN_ONLY | 403 | You do not have permission to perform this action. |
| INTERNSHIP_NOT_FOUND | 404 | This internship is not available. |
| TEST_NOT_FOUND | 404 | This test is not available. |
| QUESTION_NOT_FOUND | 404 | This question does not exist. |
| RESULT_NOT_FOUND | 404 | Result not found. |
| NOT_FOUND | 404 | Resource not found. |
| EMAIL_EXISTS | 409 | An account with this email already exists. |
| DUPLICATE_APPLICATION | 409 | You have already applied for this internship. |
| TOO_MANY_REQUESTS | 429 | Too many attempts. Please wait and try again. |
| SERVER_ERROR | 500 | Something went wrong. Please try again later. |

`new AppError('DUPLICATE_APPLICATION')` looks up status + message from the catalogue (an optional custom message may be passed for INVALID_APPLICATION / INVALID_SUBMISSION).
`validate.js`: invalid `params` (e.g. malformed ObjectId) → 400 INVALID_REQUEST; invalid `body`/`query` → 400 VALIDATION_ERROR with `details`.
`errorHandler` maps: `AppError` → its status; `ZodError` → 400 VALIDATION_ERROR with `details`; Mongoose `CastError` → 400 INVALID_REQUEST; body-parser `SyntaxError` / `entity.too.large` → 400 INVALID_REQUEST; anything else → 500 SERVER_ERROR (full stack logged server-side only, never sent).
`authorize('admin')` failure → FORBIDDEN_ADMIN_ONLY; `authorize('student')` failure → FORBIDDEN.

---

## 8. Security (SRS §5.1, SAD §3.9)

- **SR-01** `authenticate` verifies signature + expiry; missing/malformed/expired token → 401 UNAUTHORIZED. Also reject if the user no longer exists.
- **SR-02 / NFR-03** `authorize('admin')` on all `/api/admin/*`.
- **SR-03** bcryptjs hash (10 rounds); `passwordHash` has `select:false`; never logged or returned.
- **SR-04** every student query filters by `req.user.id`; foreign records → 404.
- **SR-05** all checks live in Express middleware/services; direct API calls without the UI are still blocked.
- helmet; CORS restricted to `CLIENT_ORIGIN`; `express.json({ limit: '100kb' })`; rate limit `/api/login` and `/api/register` to 20 requests / 15 min / IP (skipped when `NODE_ENV=test`) → 429 TOO_MANY_REQUESTS in the standard envelope.
- Logger never prints passwords, hashes, tokens or correct answers.

---

## 9. Frontend (SAD §4.5)

**Routes (`App.jsx`)**

| Path | Page | Access |
|---|---|---|
| `/login`, `/register` | LoginPage, RegisterPage | public (logged-in users are redirected to their dashboard) |
| `/dashboard` | StudentDashboard | student |
| `/internships` | InternshipsPage (list + search + category/location filters + pagination) | student |
| `/internships/:id` | InternshipDetailsPage (+ Apply button) | student |
| `/applications` | MyApplicationsPage | student |
| `/tests` | TestsPage | student |
| `/tests/:id/attempt` | TakeTestPage (one question at a time, progress indicator, countdown timer that auto-submits at 0, confirm before submit) | student |
| `/results` | ResultsPage | student |
| `/results/:id` | ResultDetailPage | student |
| `/progress` | ProgressPage | student |
| `/analysis` | AnalysisPage (recharts line chart for trend, bar chart for category accuracy) | student |
| `/admin` | AdminDashboard | admin |
| `/admin/internships` | ManageInternshipsPage (table + create/edit form + delete with ConfirmDialog) | admin |
| `/admin/tests` | ManageTestsPage | admin |
| `/admin/tests/:id` | ManageQuestionsPage | admin |
| `/` | redirect by role (or to /login) | — |
| `*` | NotFoundPage | — |

**Rules**
- `api/client.js`: axios `baseURL: '/api'`; request interceptor adds `Authorization: Bearer <token>`; response interceptor: on 401 with code `UNAUTHORIZED` → clear auth and go to `/login`; always reject with `{ code, message, details }` taken from the error envelope (fallback message "Something went wrong. Please try again later.").
- Token + `{ name, role }` stored in `sessionStorage` (key `oipp_auth`) — cleared on logout.
- `ProtectedRoute` takes `role` prop; wrong role → redirect to that user's own dashboard.
- **NFR-05:** the student Navbar always shows Dashboard, Internships, My Applications, Aptitude Tests, Results, Progress, Analysis, Logout. Admin Navbar: Admin Dashboard, Manage Internships, Manage Tests, Logout. The student dashboard has cards linking directly to Internships, Applications, Aptitude Tests, Progress and Analysis.
- Every data screen handles 3 states: loading (`Loader`), error (`Alert` with API message), empty (`EmptyState`).
- Forms: labelled inputs (`FormField`), client-side validation mirroring the server, field-level messages from `details`, disabled submit while sending, success `Alert`.
- Accessibility: semantic HTML, labels, visible focus, keyboard-operable controls, contrast ≥ 4.5:1, no meaning by colour alone.
- Look: clean, professional, responsive (works at 360 px and 1440 px). Design tokens in `global.css` (`--color-primary`, `--color-bg`, `--color-surface`, `--color-text`, `--color-muted`, `--color-danger`, `--color-success`, `--radius`, `--space-1..6`, `--shadow`).
- No business logic in React: never compute scores, ownership or permissions on the client.

---

## 10. Testing conventions

- `server/tests/setup.js` (Jest `setupFilesAfterEnv`): if `process.env.MONGODB_URI_TEST` is set (CI), connect to it with a unique db name per file; otherwise start `MongoMemoryServer`. Set `process.env.JWT_SECRET='test-secret'`, `NODE_ENV='test'`. After connecting run `await Promise.all(Object.values(mongoose.models).map(m => m.init()))` so unique indexes exist. `afterEach` clears all collections; `afterAll` drops the db, disconnects, stops the memory server.
- `server/jest.config.js`: `testEnvironment: 'node'`, `setupFilesAfterEnv: ['<rootDir>/tests/setup.js']`, `testTimeout: 30000`. Script: `"test": "cross-env NODE_ENV=test jest --runInBand"`.
- `tests/helpers.js` exports: `createStudent(overrides)`, `createAdmin(overrides)`, `authHeader(user)` (signs a real JWT exactly like login), `createInternship(overrides)`, `createTestWithQuestions({ questions })`.
- Test names start with the Test Plan ID: `TC-AUTH-01`, `TC-AUTH-02`, `TC-INT-01/02/03`, `TC-APP-01/02`, `TC-TEST-01/02/03/04`, `TC-PROG-01/02`, `TC-PERF-01` (FR-14 analysis), `TC-ADM-01/02`, `TC-SEC-01..05`, `TC-DATA-01`, `TC-UX-01`, `NFR-01` (perf script).
- Each story covers the happy path **and** every error code its endpoints can return.
- Client: Vitest + Testing Library; at least one test per new page/component that has logic (e.g. renders data, shows error, shows empty state). Mock the `api/*` module, never the network.

---

## 11. Git & PR conventions

- Branch: `feat/<STORY-ID>-short-name` (e.g. `feat/S1-05-apply-internship`), `test/…`, `docs/…`, `chore/…`.
- Commits: Conventional Commits with story and requirement IDs, e.g. `feat(applications): submit application with duplicate check [S1-05] (FR-06, NFR-04)`. Make several small commits (backend, frontend, tests) — not one giant commit.
- PR title: `[S1-05] Apply for internship (FR-06)`; body uses the PR template and contains `Closes #<issue>`.
- **The assigned team member opens the PR from their own account. The repo owner reviews and merges** (squash merge disabled — use "Create a merge commit" so each author's commits stay visible).
- CI must be green before merge.
