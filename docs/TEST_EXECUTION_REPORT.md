# OIPP Test Execution Report

## Run metadata

| Field | Value |
|---|---|
| Build/commit | `f1708ff` (`main` with S2-08 merged, plus the S2-09 changes) |
| Date executed | 31-Oct-2026 |
| OS | macOS (Darwin 24.3.0) |
| Node.js | v25.1.0 locally; CI uses Node 22 from `.nvmrc` |
| Browser | Google Chrome (headless), 360 px and 1440 px |
| Database | Automated tests: `mongodb-memory-server`. Browser check: seeded in-memory database |
| Tester | Namitha R, run with Claude Code. Atlas NFR-01 run: Manu Kudukundi, 30-Oct-2026 |

## Overall results

| Check | Command | Result |
|---|---|---|
| Server tests | `npm test` in `server/` | 274 of 274 passed |
| Client tests | `npm test` in `client/` | 93 of 93 passed |
| Client build | `npm run build` in `client/` | Passed |
| NFR-01 script | `npm run perf` in `server/` | 250 of 250 within 3000 ms, 0 errors |
| Browser check | Chrome against the built client and real API | Passed; see the TC-UX-01 and TC-PERF-01 rows |

## Test case execution matrix

"Tagged tests" counts the passing tests whose name carries that test case ID. A test can carry more than one ID. All cases were executed on 31-Oct-2026 by the tester above, except where a row names the 30-Oct-2026 Atlas run.

| Test case | Requirement | Automated test / manual check | Expected | Actual result | Status |
|---|---|---|---|---|---|
| TC-AUTH-01 | FR-01 | `server/tests/auth.test.js` | Registration validates input and creates a student | 11 of 11 server tagged tests passed | Pass |
| TC-AUTH-02 | FR-02 | `server/tests/auth.test.js`, client auth tests, Chrome | Login returns a session and rejects invalid credentials | 9 of 9 server and 11 of 11 client tagged tests passed; student and admin form login reached `/dashboard` and `/admin`; signed-out `/analysis` redirected to `/login` | Pass |
| TC-INT-01 | FR-03 | `server/tests/internships.test.js` | Student sees open internship listings | 4 of 4 server tagged tests passed | Pass |
| TC-INT-02 | FR-04 | `server/tests/internships.test.js` | Search/filter/pagination work | 11 of 11 server tagged tests passed | Pass |
| TC-INT-03 | FR-05 | `server/tests/internships.test.js`, `client/src/pages/InternshipDetailsPage.test.jsx` | Details and `hasApplied` are shown | 7 of 7 server and 5 of 5 client tagged tests passed | Pass |
| TC-APP-01 | FR-06, FR-12 | `server/tests/applications.test.js`, `client/src/components/ApplyButton.test.jsx` | Application is created once and activity is recorded | 3 of 3 server and 3 of 3 client tagged tests passed | Pass |
| TC-APP-02 | FR-07 | `server/tests/applications.test.js`, `client/src/pages/MyApplicationsPage.test.jsx` | Caller sees newest-first application history | 1 of 1 server and 5 of 5 client tagged tests passed | Pass |
| TC-TEST-01 | FR-08 | `server/tests/aptitude.test.js` | Available tests are listed | 3 of 3 server tagged tests passed | Pass |
| TC-TEST-02 | FR-09 | `server/tests/aptitude.test.js` | Test questions are returned without correct answers | 4 of 4 server tagged tests passed | Pass |
| TC-TEST-03 | FR-10, FR-12 | `server/tests/aptitude.test.js` | Submission is scored and one result/activity is stored | 12 of 12 server tagged tests passed | Pass |
| TC-TEST-04 | FR-11, SR-04 | `server/tests/aptitude.test.js` | Results are private and newest-first | 11 of 11 server tagged tests passed | Pass |
| TC-PROG-01 | FR-12, FR-13 | `server/tests/progress.test.js` | Progress summary is accurate and private | 2 of 2 server tagged tests passed | Pass |
| TC-PROG-02 | FR-13 | `server/tests/progress.test.js`, `ProgressPage.test.jsx` | Activity timeline is shown | 9 of 9 server and 3 of 3 client tagged tests passed | Pass |
| TC-PERF-01 (analysis) | FR-14 | `server/tests/analysis.test.js`, `AnalysisPage.test.jsx`, Chrome | Analysis maths and charts use caller results | 7 of 7 server and 4 of 4 client tagged tests passed; seeded Ravi showed 2 attempts, average 79%, best 86%, latest 71%, both charts drawn at 360 px and 1440 px; a student with no results saw the empty state | Pass |
| NFR-01 (response time) | NFR-01 | `server/scripts/perf-test.js` | At least 95% of 250 requests complete within 3 seconds | Atlas run: 250 of 250 within 3000 ms, 0 errors. Local rerun: 250 of 250, 0 errors | Pass |
| TC-ADM-01 | FR-15 | `server/tests/adminInternships.test.js` | Admin manages internships | 19 of 19 server tagged tests passed | Pass |
| TC-ADM-02 | FR-16 | `server/tests/adminAptitude.test.js` | Admin manages tests/questions | 26 of 26 server tagged tests passed | Pass |
| TC-SEC-01 | SR-01 | `server/tests/security.test.js`, `middleware.test.js`, client tests | Authentication rejects missing/invalid sessions | 60 of 60 server and 6 of 6 client tagged tests passed | Pass |
| TC-SEC-02 | SR-02 | `server/tests/security.test.js`, `middleware.test.js`, client tests | Role authorization is enforced | 36 of 36 server and 6 of 6 client tagged tests passed | Pass |
| TC-SEC-03 | SR-03 | `server/tests/auth.test.js` | Passwords are hashed and not returned | 3 of 3 server tagged tests passed | Pass |
| TC-SEC-04 | SR-04 | application/result/progress tests | Student records are isolated | 6 of 6 server tagged tests passed | Pass |
| TC-SEC-05 | SR-05 | `server/tests/security.test.js` | Server-side controls cannot be bypassed | 8 of 8 server tagged tests passed | Pass |
| TC-DATA-01 | NFR-04 | `server/tests/dataIntegrity.test.js` and other tagged tests | No duplicate/orphaned application/result records | 10 of 10 server tagged tests passed, including 6 of 6 in `dataIntegrity.test.js` | Pass |
| TC-UX-01 | NFR-05 | client UX tests, Chrome | Navigation and direct links work | 7 of 7 client tagged tests passed; in Chrome, dashboard cards opened Internships, My Applications, Aptitude Tests, Preparation Progress and Performance Analysis with no errors; student and admin navbars matched §9; logout cleared the session | Pass |

### Scope of the browser check

Chrome was used for login, logout, dashboard navigation and the Analysis page. The other screens and workflows, such as applying, taking a test and admin editing, were verified by the automated tests in the matrix and were not walked through by hand in this run. The 360 px check covered the Analysis page only.

## NFR-01 performance section

### Atlas run

Manu Kudukundi ran the script on 30-Oct-2026 on Windows, Node.js v22.19.0, at concurrency 10 against `http://localhost:5000/api` with the seeded Atlas database. The results are in `docs/perf/nfr-01-results.json`. This run predates the S2-08 review fixes and the script's overall p95 line. Those fixes did not change any API behaviour, and the script's workload changed only by removing one unused admin login.

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
| **Overall** | **250** | — | Not recorded; at most 825.92 | **825.92** | **0** |

Overall result: **100% (250/250) completed within 3000 ms**; the NFR-01 target is met.

### Local rerun

The current script was rerun on 31-Oct-2026 on macOS against a seeded in-memory database: 250 requests, overall p95 236.32 ms, slowest endpoint group `POST /login` at 1071.2 ms maximum, 100% within 3000 ms, 0 errors. This confirms that the script and code work after the merge. It is not a replacement for the Atlas timings, because an in-memory database has no network delay.

### Limits of this measurement

- The workload measures login and read requests. Write requests such as `POST /applications` and test submission are not included.
- Each run sends 11 logins against a limit of 20 per 15 minutes, so wait 15 minutes between runs or restart the server. A second run straight away reports 429 errors, not slow responses.

## Requirements coverage summary

| Requirement group | Test coverage | Status |
|---|---|---|
| FR-01 to FR-07 | TC-AUTH-01/02, TC-INT-01/02/03, TC-APP-01/02 | Pass |
| FR-08 to FR-11 | TC-TEST-01/02/03/04 | Pass |
| FR-12 to FR-14 | TC-PROG-01/02, TC-PERF-01 (analysis) | Pass |
| FR-15 to FR-16 | TC-ADM-01/02 | Pass |
| NFR-01 | NFR-01 response time | Pass: 100% within 3 seconds |
| NFR-03 to NFR-05 | TC-SEC-01..05, TC-DATA-01, TC-UX-01 | Pass |
| SR-01 to SR-05 | TC-SEC-01..05 | Pass |

## Defects and review fixes

There are no open defects from this run. Findings during S2-08 and S2-09 verification:

| Finding | Outcome |
|---|---|
| Analysis page scrolled sideways at 360 px, and one category label was hidden | Fixed in S2-08 before merge |
| `POST /api/applications` returns `INVALID_APPLICATION` for an invalid body, where §7 specifies `VALIDATION_ERROR` | The request is rejected safely; logged as D-14 |
| `TC-PERF-01` is used for both analysis and response time | Logged as D-12 |
