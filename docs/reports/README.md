# OIPP Test Reports (Part-3)

Test reports for Mini-Project Deliverables Part-3, item 2. They were run on 06-11-2026 against `main` at commit `569fa35`, following the Software Test Plan v3.0 (`docs/OIPP_Software_Test_Plan_v3_Final.docx`).

| Report | File | Headline result |
|---|---|---|
| Unit Test Report | [OIPP_Unit_Test_Report.docx](OIPP_Unit_Test_Report.docx) | 367 of 367 tests passed (server 274, client 93) |
| System Validation Report | [OIPP_System_Validation_Report.docx](OIPP_System_Validation_Report.docx) | 24 of 24 test cases pass; 80 of 81 checks passed with 1 observation; Postman 36/36; NFR-01 met |
| Code Coverage Report | [OIPP_Code_Coverage_Report.docx](OIPP_Code_Coverage_Report.docx) | Statements: server 92.3%, client 84.2% |
| Branch Coverage Report | [OIPP_Branch_Coverage_Report.docx](OIPP_Branch_Coverage_Report.docx) | Branches: server 76.3%, client 77.8% |

## Evidence

| Path | Contents |
|---|---|
| `coverage-html/server/index.html` | Server coverage report (Jest/Istanbul), file by file and line by line |
| `coverage-html/client/index.html` | Client coverage report (Vitest/V8) |
| `evidence/server-test-results.json`, `evidence/client-test-results.json` | Raw Jest and Vitest results |
| `evidence/*-coverage-summary.json` | Coverage totals per file |
| `evidence/system-validation-results.json` | Every system validation check: step, expected, actual, status |
| `evidence/newman-summary.json` | Postman/Newman run (tokens removed) |
| `evidence/nfr-01-local-standalone.json` | NFR-01 performance run on a standalone MongoDB |
| `evidence/screens/` | 42 screenshots from the system validation run |

## How to reproduce

```bash
# Unit tests and server coverage
cd server && npm test
npx cross-env NODE_ENV=test jest --runInBand --coverage --collectCoverageFrom='src/**/*.js'

# Client tests and coverage (@vitest/coverage-v8 is not yet a project dependency)
cd client && npm test
npm install --no-save @vitest/coverage-v8@2.1.9
npx vitest run --coverage --coverage.provider=v8 --coverage.include='src/**/*.{js,jsx}'

# System validation: seed a development database, start both apps, then follow
# the Test Steps in Test Plan §13.3 and run the Postman collection
cd server && npm run seed && npm run dev      # API on :5000
cd client && npm run dev                       # client on :5173
npx newman run docs/api/OIPP.postman_collection.json
cd server && npm run perf                      # NFR-01; overwrites docs/perf/nfr-01-results.json
```

`npm run seed` deletes existing data. Use a development database only.
