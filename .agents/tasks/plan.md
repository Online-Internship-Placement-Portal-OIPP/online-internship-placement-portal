# Implementation Plan — S2-02 Server-side Scoring and Results

## Key design decisions (from codebase reading)

- **Results router**: A separate `results.routes.js` file is created and mounted as `apiRouter.use('/results', ...)` in `app.js`. The existing aptitude router stays mounted at `/tests` unchanged. This is the only way to serve `GET /api/results` and `GET /api/results/:id` — adding them to `aptitude.routes.js` wouldn't work since that router is mounted at `/tests`.
- **testsApi.js**: Already has `submitTest`, `getResults` and `getResultById` as stubs in the default export. We add named exports `listResults` and `getResult` and point the default-export stubs at them. No duplicates.
- **App.jsx**: Routes `/results` and `/results/:id` already exist — NO new route lines needed.
- **correctOption safety**: `evaluateSubmission` uses `.select('+correctOption')` only internally. The return value is constructed manually — `correctOption` is never spread or serialized into the response.
- **Scoring for unanswered questions**: Unanswered questions score 0 (by absence from answers array). Only validate the answers that ARE submitted.

---

## Files to create or modify

| File | Action | Purpose |
|---|---|---|
| `server/src/modules/aptitude/aptitude.schemas.js` | Modify | Add `submitBodySchema` and `resultParamsSchema` |
| `server/src/modules/aptitude/aptitude.service.js` | Modify | Add `evaluateSubmission`, `listResults`, `getResult` |
| `server/src/modules/aptitude/aptitude.controller.js` | Modify | Add `submitTestHandler`, `listResultsHandler`, `getResultHandler` |
| `server/src/modules/aptitude/aptitude.routes.js` | Modify | Add `POST /:id/submit` route |
| `server/src/modules/aptitude/results.routes.js` | **Create** | New router for `GET /results` and `GET /results/:id` |
| `server/src/app.js` | Modify | Add `apiRouter.use('/results', require('./modules/aptitude/results.routes'))` |
| `server/tests/aptitude.test.js` | Modify | Append TC-TEST-03 and TC-TEST-04 describe blocks |
| `client/src/api/testsApi.js` | Modify | Add named exports `listResults`, `getResult`; update default object stubs |
| `client/src/pages/ResultsPage.jsx` | Modify | Replace placeholder with full implementation |
| `client/src/pages/ResultDetailPage.jsx` | Modify | Replace placeholder with full implementation |
| `client/src/pages/ResultDetailPage.test.jsx` | **Create** | Client vitest test for ResultDetailPage |

---

## Ordered implementation steps

- [ ] 1. Update `server/src/modules/aptitude/aptitude.schemas.js`.
      Add `submitBodySchema`: a strict zod object with `answers` as an array (max 200) of strict objects `{ questionId: objectIdSchema, selectedOption: z.number().int().min(0) }`. Add `resultParamsSchema`: reuse `objectIdSchema` for `id`, same shape as `aptitudeParamsSchema`. Export both.
      Files: `server/src/modules/aptitude/aptitude.schemas.js`
      Verify: file saves without syntax errors (verified in step 8 test run).

- [ ] 2. Add `evaluateSubmission(studentId, testId, answers)` to `server/src/modules/aptitude/aptitude.service.js`.
      Logic: (a) load Test → `TEST_NOT_FOUND` if missing; (b) `Question.find({ testId }).select('+correctOption')` → `TEST_NOT_FOUND` if empty; (c) validate all submitted answers: unknown questionId → `INVALID_SUBMISSION`, duplicate questionId → `INVALID_SUBMISSION`, selectedOption ≥ options.length → `INVALID_SUBMISSION`; (d) score all questions (missing = 0 marks), compute `totalMarks`, `percentage = Math.round(score/totalMarks*100)` (guard totalMarks=0); (e) build `categoryScores` grouped by category, sorted alphabetically by category name; (f) `Result.create(...)` with all fields; (g) `recordActivity(studentId, 'TEST_COMPLETED', testId)`; (h) return `{ resultId, testId, score, totalMarks, percentage, categoryScores }` — NEVER include `correctOption`.
      Require `recordActivity` from `../../modules/progress/activity.service`.
      Files: `server/src/modules/aptitude/aptitude.service.js`
      Verify: step 8 test run (TC-TEST-03).

- [ ] 3. Add `listResults(studentId)` and `getResult(studentId, resultId)` to `server/src/modules/aptitude/aptitude.service.js`.
      `listResults`: `Result.find({ studentId }).sort({ submittedAt: -1 }).populate('testId', 'title').lean()` — map to `{ resultId, testId, testTitle (or 'Test removed'), score, totalMarks, percentage, submittedAt }`.
      `getResult`: `Result.findOne({ _id: resultId, studentId }).populate('testId', 'title').lean()` — if null throw `AppError('RESULT_NOT_FOUND')` — return same fields plus `categoryScores`.
      Files: `server/src/modules/aptitude/aptitude.service.js`
      Verify: step 8 test run (TC-TEST-04).

- [ ] 4. Add controller handlers in `server/src/modules/aptitude/aptitude.controller.js`.
      `submitTestHandler`: `asyncHandler` wrapping `evaluateSubmission(req.user.id, req.params.id, req.body.answers)`, responds with `ok(res, data, 200)`.
      `listResultsHandler`: calls `listResults(req.user.id)`, `ok(res, data)`.
      `getResultHandler`: calls `getResult(req.user.id, req.params.id)`, `ok(res, data)`.
      Files: `server/src/modules/aptitude/aptitude.controller.js`
      Verify: step 8 test run.

- [ ] 5. Add `POST /:id/submit` route to `server/src/modules/aptitude/aptitude.routes.js`.
      Import `submitBodySchema` from `./aptitude.schemas` and `submitTestHandler` from `./aptitude.controller`. Add: `router.post('/:id/submit', authenticate, authorize('student'), validate({ params: aptitudeParamsSchema, body: submitBodySchema }), submitTestHandler)`.
      Files: `server/src/modules/aptitude/aptitude.routes.js`
      Verify: step 8 test run.

- [ ] 6. Create `server/src/modules/aptitude/results.routes.js`.
      New `Router()`. Import `authenticate, authorize` from `../../middleware/auth`, `validate` from `../../middleware/validate`, `resultParamsSchema` from `./aptitude.schemas`, and `listResultsHandler, getResultHandler` from `./aptitude.controller`. Add `GET /` (authenticate, authorize('student'), listResultsHandler) and `GET /:id` (authenticate, authorize('student'), validate({ params: resultParamsSchema }), getResultHandler). Export the router.
      Files: `server/src/modules/aptitude/results.routes.js` (new)
      Verify: step 8 test run.

- [ ] 7. Register results router in `server/src/app.js`.
      After the `/tests` line, add: `apiRouter.use('/results', require('./modules/aptitude/results.routes'));`. Do not touch the `/tests` registration.
      Files: `server/src/app.js`
      Verify: `GET /api/results` returns 401 when called without token (confirms it is mounted).

- [ ] 8. Add TC-TEST-03 and TC-TEST-04 describe blocks to `server/tests/aptitude.test.js`.
      Append after TC-TEST-02. Import `Activity` from `'../src/models'` at the top (already imports `Result`).
      TC-TEST-03 fixture: 4 questions, 2 categories (Quantitative: marks 2+3=5, Logical: marks 1+2=3), totalMarks=8. Sub-tests: all-correct (score=8, %=100), all-wrong (score=0, %=0), mixed (score correct subset), unanswered (empty answers), unknown questionId (400, no Result), duplicate questionId (400, no Result), out-of-range selectedOption (400, no Result), activity created on success.
      TC-TEST-04 sub-tests: list newest-first, own result 200+categoryScores, other student's result 404, malformed id 400, deleted test shows 'Test removed'.
      Files: `server/tests/aptitude.test.js`
      Verify: `npm --prefix server test` — all TC-TEST-01 through TC-TEST-04 pass.

- [ ] 9. Update `client/src/api/testsApi.js`.
      Add named exports: `export const listResults = () => apiClient.get('/results');` and `export const getResult = (id) => apiClient.get(\`/results/${id}\`);`. In the `testsApi` default export object, replace the `getResults` and `getResultById` stubs with `listResults` and `getResult` respectively (keep the same keys or add the new ones alongside). Do NOT touch `submitTest`, `listTests`, or `getTest`.
      Files: `client/src/api/testsApi.js`
      Verify: `npm --prefix client test` passes.

- [ ] 10. Replace `client/src/pages/ResultsPage.jsx`.
       States: loading (`<Loader />`), error (`<Alert type="error" />`), empty (`<EmptyState>` with link to /tests), data (table with columns: Test, Score, Percentage, Date, Action). Fetch with `listResults()` imported from `../api/testsApi`. Each row has `<Link to={/results/${r.resultId}}>View</Link>`. Newest first (API order). Accessibility: `<th scope="col">`, `<td>` first column as `<th scope="row">`.
       Files: `client/src/pages/ResultsPage.jsx`
       Verify: `npm --prefix client test` and `npm --prefix client run build`.

- [ ] 11. Replace `client/src/pages/ResultDetailPage.jsx`.
       `const { id } = useParams()`. Fetch `getResult(id)` on mount. States: Loader, Alert error (including 404). Data: large percentage display, score/total, formatted date, category scores table (Category | Score | Total | Bar), CSS progress bar per row using `Math.round(row.score/row.total*100)` width. Action links: `<Link to={/tests/${data.testId}/attempt}>Retake Test</Link>` and `<Link to="/analysis">View Analysis</Link>`. Use `Loader`, `Alert`, imported from `../components/`.
       Files: `client/src/pages/ResultDetailPage.jsx`
       Verify: `npm --prefix client test` and `npm --prefix client run build`.

- [ ] 12. Create `client/src/pages/ResultDetailPage.test.jsx`.
       `vi.mock('../api/testsApi', ...)` with `getResult: vi.fn()`. Two describe blocks: (a) renders percentage, score/total, and category rows when API resolves; (b) shows Alert when API rejects. Use `MemoryRouter`, `render`, `screen`, `waitFor` from `@testing-library/react`. Follow pattern from `client/src/pages/InternshipsPage.test.jsx`.
       Files: `client/src/pages/ResultDetailPage.test.jsx` (new)
       Verify: `npm --prefix client test`.

- [ ] 13. Self-check (run after all steps complete).
       1. `npm --prefix server test` — all green.
       2. `npm --prefix client test` — all green.
       3. `npm --prefix client run build` — no errors.
       4. Grep `server/src/modules/aptitude/` for `correctOption` — confirm every match is only the model file, a comment, or `.select('+correctOption')` in `evaluateSubmission`.
       5. Confirm no duplicate routes in `App.jsx` (no second `/results` entry).
       6. Confirm `package.json` files are unchanged.
       Files: (verification only)
       Verify: all three commands exit 0.
