# Security Validation Report

**Story:** S2-04 · **Requirements:** SR-01 to SR-05, SO-01, SO-02 · **Test cases:** TC-SEC-01 to TC-SEC-05
**Source:** Software Test Plan v2 §5.1 · **Date executed:** 2026-10-30 · **Build:** `feature/s2-04-security-validation` (includes S2-01, S2-02 and S2-03)

## Summary

| # | Test Plan §5.1 check | Requirement | Test case | Result |
|---|---|---|---|---|
| 1 | Access protected pages and APIs without logging in | SR-01 | TC-SEC-01 | **Pass** |
| 2 | Use administrator functions with a student account | SR-02 | TC-SEC-02 | **Pass** |
| 3 | Passwords are not stored or returned as plain text | SR-03 | TC-SEC-03 | **Pass** |
| 4 | Access another student's applications and results | SR-04 | TC-SEC-04 | **Pass** (analysis pending, see [Open items](#open-items)) |
| 5 | Invalid requests and errors do not expose sensitive information | SR-05 | TC-SEC-05 | **Pass** |
| 6 | Direct unauthorized API requests that bypass the frontend | SR-05 | TC-SEC-05 | **Pass** |

Two defects were found during validation and fixed in this story. See [Defects found and fixed](#defects-found-and-fixed).

## How the checks were run

| Method | What it covers | How to repeat it |
|---|---|---|
| Automated server tests | Real Express app and MongoDB (in-memory replica set) through `supertest` | `cd server && npm test` (`tests/security.test.js`, `tests/auth.test.js`, `tests/applications.test.js`, `tests/aptitude.test.js`, `tests/adminAptitude.test.js`) |
| Automated client tests | React route guards | `cd client && npm test` (`src/test/TC-SEC-01-02.test.jsx`) |
| Postman / Newman run | Live API on a **standalone** local MongoDB 7, seeded with `npm run seed` | Import `docs/api/OIPP.postman_collection.json`, then run the collection; or `npx newman run docs/api/OIPP.postman_collection.json` |

**Results of this run:**
- Server: 10 suites, **246 / 246 tests passed** (85 of them in `security.test.js`)
- Client: 15 files, **81 / 81 tests passed**
- Postman collection (Newman 6.2.1): **36 / 36 requests, 47 / 47 assertions passed**

## Check details

### 1. SR-01 Authentication (TC-SEC-01)

**Steps**
1. Without logging in, open `/dashboard`, `/tests`, `/results` and `/admin` in the browser.
2. Call every protected API route with no `Authorization` header.
3. Repeat with a tampered signature, an expired token, an unsigned `alg: none` token, and a valid token for a user who has since been deleted.

**Expected:** pages redirect to `/login`; APIs return `401 UNAUTHORIZED` in the standard error envelope.

**Evidence**
- `security.test.js` › `TC-SEC-01 - Protected API authentication` (internship, test and results routes: no token, tampered, expired).
- `security.test.js` › `TC-SEC-01 - Sprint 2 API authentication`: all 14 Sprint 2 routes (`/tests`, `/tests/:id`, `/tests/:id/submit`, `/results`, `/results/:id`, `/progress` and the 8 `/admin/tests` and `/admin/questions` routes) with no token and with expired tokens; deleted-user token; `alg: none` token.
- `security.test.js` › `TC-SEC-01 and TC-SEC-02 - Application API security`.
- `TC-SEC-01-02.test.jsx` › `TC-SEC-01 redirects unauthenticated user to /login when accessing protected route`.
- Postman › `7. Security checks` › `TC-SEC-01 no token`, `TC-SEC-01 tampered token` → 401 `UNAUTHORIZED`.

**Result:** Pass

### 2. SR-02 Authorization (TC-SEC-02)

**Steps**
1. Log in as a student and open `/admin`, `/admin/internships` and `/admin/tests`.
2. With a student token, call every `/api/admin/*` route.
3. With an admin token, call the student-only routes (`/applications`, `/tests`, `/results`).
4. Sign a token for a student that claims `role: "admin"` and call an admin route.

**Expected:** student is redirected to `/dashboard`; admin routes return `403 FORBIDDEN_ADMIN_ONLY`; student routes return `403 FORBIDDEN` to admins; a forged role claim has no effect, because `authenticate` re-reads the role from the database.

**Evidence**
- `security.test.js` › `TC-SEC-02 - Admin internship API security` (3 internship admin routes).
- `security.test.js` › `TC-SEC-02 - Sprint 2 role-based authorization`: all 8 admin test/question routes reject students; all 6 student test/result/progress routes reject admins; forged admin role rejected.
- `adminAptitude.test.js` › `TC-ADM-02` student 403 tests for each admin aptitude endpoint.
- `TC-SEC-01-02.test.jsx` › `TC-SEC-02 redirects student accessing admin route to /dashboard` and `… admin accessing student-only route to /admin`.
- Postman › `TC-SEC-02 student calls admin endpoint` → 403 `FORBIDDEN_ADMIN_ONLY`.

**Result:** Pass

### 3. SR-03 Password protection (TC-SEC-03)

**Steps**
1. Register a student, then read the stored user document directly from MongoDB.
2. Check the register and login responses for any password data.

**Expected:** the stored value is a bcrypt hash (`$2a$`/`$2b$`, 10 rounds), never the password; `passwordHash` and the password never appear in any response or log.

**Evidence**
- `auth.test.js` › `TC-SEC-03 POST /api/register — password security`: hash is not the plain password, matches `^\$2[aby]\$`, verifies with `bcrypt.compare`; no `passwordHash` in the register or login responses.
- `security.test.js` › every error assertion (`expectSafeError`) also checks that `passwordHash` is absent.
- `User.passwordHash` is `select: false`, so it is only loaded where login explicitly asks for it.
- Postman › `TC-SEC-03 login response has no password data` → no `passwordHash`, no plain password.

**Result:** Pass

### 4. SR-04 Student-data protection (TC-SEC-04)

**Steps**
1. Create results and applications for two students.
2. As student B, list results and applications, and open student A's result by id.
3. As a student, submit a test with another student's id in the request body.

**Expected:** each student sees only their own records; another student's result returns `404 RESULT_NOT_FOUND` (its existence is not revealed); identity always comes from the token, never from the body.

**Evidence**
- `applications.test.js` › `TC-SEC-04 applications are private`.
- `security.test.js` › `TC-SEC-04 - Student result data isolation` (other student's result → 404).
- `security.test.js` › `TC-SEC-04 - Sprint 2 student data isolation`: results list contains only the caller's results; a `studentId` in the submit body is rejected with `400 VALIDATION_ERROR` and nothing is saved for the other student; a submitted result is stored under the token user.
- `security.test.js` › `TC-SEC-04 - Sprint 2 student data isolation` › `progress is built only from the caller's data` (added in S2-05).
- `aptitude.test.js` › `TC-TEST-04` › `another student's result returns 404 RESULT_NOT_FOUND`.
- Postman › `TC-SEC-04 other student's result` (Asha opens Ravi's result) → 404 `RESULT_NOT_FOUND`.

**Result:** Pass for applications, results and progress. Analysis is pending (see [Open items](#open-items)).

### 5. Errors do not expose sensitive information (TC-SEC-05)

**Steps**
1. Send malformed JSON, an oversized body (> 100 kb), malformed ids and unknown fields.
2. Open and submit a test as a student, and inspect the responses.
3. Inspect the response headers.

**Expected:** `400 INVALID_REQUEST` or `400 VALIDATION_ERROR` in the standard envelope, with no stack traces, `SyntaxError` text or raw database errors; students never receive `correctOption`; security headers are set.

**Evidence**
- `security.test.js` › `TC-SEC-05 - Sprint 2 server-side protection`: malformed JSON → `INVALID_REQUEST` with no `SyntaxError`/stack; body over 100 kb → `INVALID_REQUEST`; unknown field in an admin body → `VALIDATION_ERROR`; `correctOption` absent from `GET /tests/:id` and from the submit response.
- `expectSafeError` (used by every security test) checks for no `"stack"` key and no `passwordHash`.
- Live server headers (helmet): `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`; no `X-Powered-By`.
- CORS: `Access-Control-Allow-Origin` is always `http://localhost:5173` (`CLIENT_ORIGIN`), so browsers block other origins.
- Postman › `TC-SEC-05 malformed JSON` → 400 `INVALID_REQUEST`, no `stack`.

**Result:** Pass

### 6. SR-05 Direct API requests bypassing the frontend (TC-SEC-05)

**Steps**
1. Call protected and admin endpoints directly (`supertest`, Postman), without the React app.
2. Send more than 20 login or register requests from one IP within 15 minutes.

**Expected:** every rule is enforced by Express middleware and services, so direct calls get the same 401/403/404/400 answers as the UI; the 21st auth request returns `429 TOO_MANY_REQUESTS`.

**Evidence**
- All checks in sections 1, 2, 4 and 5 call the API directly, without the frontend.
- `security.test.js` › `TC-SEC-05 - Server-side API security` (direct call without a token; no `passwordHash` in responses).
- `security.test.js` › `TC-SEC-05 - Login and registration rate limiting`: requests 1–20 to `/api/login` and to `/api/register` are processed; the 21st returns `429 TOO_MANY_REQUESTS`. The limiter is skipped when `NODE_ENV=test`, so this test loads the app with a development config.
- Manual check against the running server: 20 × 400 then 429.

**Result:** Pass (after fixing defect SEC-D1)

## Defects found and fixed

| ID | Found by | Defect | Impact | Fix | Regression test |
|---|---|---|---|---|---|
| SEC-D1 | Manual rate-limit check | `authLimiter` was defined in `middleware/security.js` but never attached to `/api/login` or `/api/register`, although the comment in `auth.routes.js` said it was applied. | Unlimited password-guessing attempts (CLAUDE.md §8). | `authLimiter` added to both routes in `modules/auth/auth.routes.js`. | `TC-SEC-05 - Login and registration rate limiting` (fails without the fix) |
| SEC-D2 | Postman run on a standalone MongoDB | `DELETE /api/admin/tests/:id` always used a transaction, which a standalone local MongoDB does not support, so it returned `500 SERVER_ERROR`. The automated tests use a replica set, so they did not catch it. | Admins on a local Community Server could not delete tests. | `deleteTest` now uses a transaction only when the deployment supports it, otherwise deletes the questions and then the test, the same way internship delete already does. | `TC-ADM-02` › `deletes a test and its questions on a standalone MongoDB (no transactions)` |

## Open items

| Item | Reason | Action |
|---|---|---|
| Cross-student access to `GET /api/analysis` (SO-01) | This endpoint is built in S2-08 and is not merged yet. The route currently returns `404 NOT_FOUND`. `GET /api/progress` was closed by S2-05. | When S2-08 merges, add the route to the `sprint2StudentRoutes` list in `security.test.js` (gives 401/403 coverage automatically) and add a test that the response is built only from the caller's data. Then update this section to Pass. |
| HTTPS | Local development uses HTTP on localhost (deviation D-01). | Verify on the deployed instance. |

## Notes

- `/api/login` and `/api/register` share one limiter, so the limit of 20 per 15 minutes per IP covers both routes together.
