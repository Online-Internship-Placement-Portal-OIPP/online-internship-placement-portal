# OIPP Test Execution Report

## Run metadata

| Field | Value |
|---|---|
| Build/commit | `820619a` (S2-09 verification branch; based on S2-08) |
| Date prepared | 30-Oct-2026 |
| OS | Windows |
| Node.js | v22.19.0 |
| Browser | Browser UI not manually exercised; client tests/build passed |
| Tester | Manu Kudukundi |

This report records the seeded Atlas-backed run performed on 30-Oct-2026. The focused S2-08 analysis tests, focused S2-09 data-integrity tests, client production build, seeded Ravi analysis response, and performance workload were run locally.

## Test case execution matrix

| Test case | Requirement | Automated test / manual check | Expected | Actual result | Status |
|---|---|---|---|---|---|
| TC-AUTH-01 | FR-01 | `server/tests/auth.test.js` | Registration validates input and creates a student | Existing automated coverage | Pass* |
| TC-AUTH-02 | FR-02 | `server/tests/auth.test.js`, client auth tests | Login returns a session and rejects invalid credentials | Existing automated coverage | Pass* |
| TC-INT-01 | FR-03 | `server/tests/internships.test.js`, `client/src/pages/InternshipsPage.test.jsx` | Student sees open internship listings | Existing automated coverage | Pass* |
| TC-INT-02 | FR-04 | `server/tests/internships.test.js`, `client/src/pages/InternshipsPage.test.jsx` | Search/filter/pagination work | Existing automated coverage | Pass* |
| TC-INT-03 | FR-05 | `server/tests/internships.test.js`, `client/src/pages/InternshipDetailsPage.test.jsx` | Details and `hasApplied` are shown | Existing automated coverage | Pass* |
| TC-APP-01 | FR-06, FR-12 | `server/tests/applications.test.js` | Application is created once and activity is recorded | Existing automated coverage | Pass* |
| TC-APP-02 | FR-07 | `server/tests/applications.test.js`, `client/src/pages/MyApplicationsPage.test.jsx` | Caller sees newest-first application history | Existing automated coverage | Pass* |
| TC-TEST-01 | FR-08 | `server/tests/aptitude.test.js`, client test pages | Available tests are listed | Existing automated coverage | Pass* |
| TC-TEST-02 | FR-09 | `server/tests/aptitude.test.js`, `TakeTestPage.test.jsx` | Test questions are returned without correct answers | Existing automated coverage | Pass* |
| TC-TEST-03 | FR-10, FR-12 | `server/tests/aptitude.test.js` | Submission is scored and one result/activity is stored | Existing automated coverage | Pass* |
| TC-TEST-04 | FR-11, SR-04 | `server/tests/aptitude.test.js`, result tests | Results are private and newest-first | Existing automated coverage | Pass* |
| TC-PROG-01 | FR-12, FR-13 | `server/tests/progress.test.js`, `ProgressPage.test.jsx` | Progress summary is accurate and private | Existing automated coverage | Pass* |
| TC-PROG-02 | FR-13 | `server/tests/progress.test.js`, `ProgressPage.test.jsx` | Activity timeline is shown | Existing automated coverage | Pass* |
| TC-PERF-01 (analysis) | FR-14 | `server/tests/analysis.test.js`, `AnalysisPage.test.jsx`, seeded Ravi API check | Analysis maths and charts use caller results | Backend 5/5; client 2/2; build passed; Ravi returned 2 attempts, average 79% | Pass |
| NFR-01 (response time) | NFR-01 | `server/scripts/perf-test.js`, seeded Atlas run | At least 95% of 250 requests complete within 3 seconds | 250/250 within 3000 ms (100%), 0 errors | Pass |
| TC-ADM-01 | FR-15 | `server/tests/adminInternships.test.js`, admin page tests | Admin manages internships | Existing automated coverage | Pass* |
| TC-ADM-02 | FR-16 | `server/tests/adminAptitude.test.js`, admin page tests | Admin manages tests/questions | Existing automated coverage | Pass* |
| TC-SEC-01 | SR-01 | `server/tests/security.test.js`, `middleware.test.js` | Authentication rejects missing/invalid sessions | Existing automated coverage | Pass* |
| TC-SEC-02 | SR-02 | `server/tests/security.test.js`, `middleware.test.js` | Role authorization is enforced | Existing automated coverage | Pass* |
| TC-SEC-03 | SR-03 | `server/tests/auth.test.js` | Passwords are hashed and not returned | Existing automated coverage | Pass* |
| TC-SEC-04 | SR-04 | application/result/progress tests | Student records are isolated | Existing automated coverage | Pass* |
| TC-SEC-05 | SR-05 | `server/tests/security.test.js` | Server-side controls cannot be bypassed | Existing automated coverage | Pass* |
| TC-DATA-01 | NFR-04 | `server/tests/dataIntegrity.test.js` | No duplicate/orphaned application/result records | Focused suite 4/4 passed | Pass |
| TC-UX-01 | NFR-05 | existing client UX tests; manual browser run pending | Navigation and direct links work | Existing automated coverage | Pass* |

`Pass*` means the case is covered by the existing repository test suite or client test suite; the complete clean-room run on the final merged main branch remains a team execution step.

## NFR-01 performance section

The script measured 250 requests at concurrency 10 against `http://localhost:5000/api` using the seeded Atlas database. It printed count, min, average, p95, max, errors, overall percentage under 3000 ms, and wrote `docs/perf/nfr-01-results.json`.

| Endpoint group | Count | Average ms | P95 ms | Max ms | Errors |
|---|---:|---:|---:|---:|---:|
| POST /login | 10 | 492.58 | 825.92 | 825.92 | 0 |
| GET /internships | 24 | 206.84 | 456.65 | 468.40 | 0 |
| GET /internships?search=software | 24 | 88.35 | 269.98 | 271.51 | 0 |
| GET /internships?category=Software Development | 24 | 77.93 | 250.29 | 253.59 | 0 |
| GET /internships?location=Bengaluru | 24 | 80.98 | 258.01 | 269.73 | 0 |
| GET /internships/:id | 24 | 83.09 | 91.61 | 94.49 | 0 |
| GET /applications | 24 | 82.98 | 87.51 | 92.04 | 0 |
| GET /tests | 24 | 56.18 | 60.91 | 62.23 | 0 |
| GET /results | 24 | 85.80 | 92.32 | 123.43 | 0 |
| GET /progress | 24 | 158.04 | 327.39 | 352.01 | 0 |
| GET /analysis | 24 | 84.19 | 101.73 | 111.28 | 0 |
| **Overall** | **250** | — | — | — | **0** |

Overall result: **100% (250/250) completed within 3000 ms**; NFR-01 target is met.

## Requirements coverage summary

| Requirement group | Test coverage | Status |
|---|---|---|
| FR-01 to FR-07 | TC-AUTH-01/02, TC-INT-01/02/03, TC-APP-01/02 | Pass* |
| FR-08 to FR-11 | TC-TEST-01/02/03/04 | Pass* |
| FR-12 to FR-14 | TC-PROG-01/02, TC-PERF-01 (analysis) | Pass* / Pass |
| FR-15 to FR-16 | TC-ADM-01/02 | Pass* |
| NFR-01 | NFR-01 response time | Pass — 100% within 3 seconds |
| NFR-03 to NFR-05 | TC-SEC-01..05, TC-DATA-01, TC-UX-01 | Pass* / Pass |
| SR-01 to SR-05 | TC-SEC-01..05 | Pass* |

## Defects and review fixes

No open defect was introduced by S2-08 or the S2-09 test additions. Review fixes from earlier sprints are present in the merged baseline. The `TC-PERF-01` naming overlap is recorded as D-12 in `docs/DEVIATIONS.md`.
