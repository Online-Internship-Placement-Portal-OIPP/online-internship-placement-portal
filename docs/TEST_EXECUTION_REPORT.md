# OIPP Test Execution Report

## Run metadata

| Field | Value |
|---|---|
| Build/commit | `6c435f379171e3ca58be3332eb48502f74040011` (S2-08 baseline) |
| Date prepared | 30-Oct-2026 |
| OS | Windows |
| Node.js | v22.19.0 |
| Browser | Manual browser run pending in the seeded demo environment |
| Tester | Manu Kudukundi |

This report is intentionally factual. The focused S2-08 analysis tests, focused S2-09 data-integrity tests, and client production build were run locally. A seeded server-side performance run was not performed on this machine because MongoDB is not installed/running; therefore no NFR-01 percentage is invented here. Run `npm run seed`, start the server, then run `npm run perf` to replace the pending NFR-01 entry with the generated `docs/perf/nfr-01-results.json` values.

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
| TC-PERF-01 (analysis) | FR-14 | `server/tests/analysis.test.js`, `AnalysisPage.test.jsx` | Analysis maths and charts use caller results | Backend 5/5; client 2/2; build passed | Pass |
| NFR-01 (response time) | NFR-01 | `server/scripts/perf-test.js`, seeded manual run pending | At least 95% of 250 requests complete within 3 seconds | MongoDB/seeded server unavailable locally | Pending |
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

The script measures 250 requests at concurrency 10 across internship listing/filter/detail, applications, tests, results, progress, analysis, and login. It prints count, min, average, p95, max, errors, overall percentage under 3000 ms, and writes `docs/perf/nfr-01-results.json`. The result is pending until it is run against a seeded server.

## Requirements coverage summary

| Requirement group | Test coverage | Status |
|---|---|---|
| FR-01 to FR-07 | TC-AUTH-01/02, TC-INT-01/02/03, TC-APP-01/02 | Pass* |
| FR-08 to FR-11 | TC-TEST-01/02/03/04 | Pass* |
| FR-12 to FR-14 | TC-PROG-01/02, TC-PERF-01 (analysis) | Pass* / Pass |
| FR-15 to FR-16 | TC-ADM-01/02 | Pass* |
| NFR-01 | NFR-01 response time | Pending seeded run |
| NFR-03 to NFR-05 | TC-SEC-01..05, TC-DATA-01, TC-UX-01 | Pass* / Pass |
| SR-01 to SR-05 | TC-SEC-01..05 | Pass* |

## Defects and review fixes

No open defect was introduced by S2-08 or the S2-09 test additions. Review fixes from earlier sprints are present in the merged baseline. The `TC-PERF-01` naming overlap is recorded as D-12 in `docs/DEVIATIONS.md`.
