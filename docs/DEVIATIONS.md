# Implementation Deviations

Add a row on the same day any implementation differs from the SRS, Software Architecture and Design (SAD) specification, or Test Plan. Review all deviations during the final demo.

| ID | Document & section | What was planned | What we implemented | Reason | Sprint | Approved by |
|---|---|---|---|---|---|---|
| D-01 | SRS §3.4 / SAD §3.9.2 | HTTPS communication | Local development demo uses HTTP on localhost; HTTPS applies to the deployed instance. | Local development setup | Dry Run | Pending |
| D-02 | SOURCE_OF_TRUTH.md §15 | API endpoints defined in the agreed API specification | Additional endpoints proposed in SAD §4.3.2 are included in the Source of Truth API table and implemented. | Support required application functionality | Dry Run | Pending |
| D-03 | SAD §4.3.2 | Internship listing and filtering | Added `GET /api/internships/meta` to provide category and location filter options. | Support FR-04 | Dry Run | Pending |
| D-04 | SAD §4.3.2 | Admin test management | Added `GET /api/admin/tests` and `GET /api/admin/tests/:id` so administrators can view questions and correct answers while editing tests. | Support FR-16 | Dry Run | Pending |
| D-05 | SAD §4.4.2 | Existing API error catalogue | Extended the error catalogue with `FORBIDDEN`, `QUESTION_NOT_FOUND`, `NOT_FOUND`, and `TOO_MANY_REQUESTS`. | Cover additional authorization, resource, and rate-limit errors | Dry Run | Pending |
| D-06 | SAD §3.4 | Maintain consistent related records | Deleting an internship also deletes its applications. Deleting a test deletes its questions but retains results for historical records. | Maintain data consistency while preserving result history (NFR-04) | Dry Run | Pending |
| D-07 | SAD §4.3.3 | API responses and client-side authentication | Some responses include additional UI fields: `hasApplied`, `deadlinePassed`, `questionCount`, `totalMarks`, `attempts`, `totalAttempts`, `completionPercentage`, and `correctMarks/totalMarks`. JWTs are stored in `sessionStorage`. | Support frontend display and session handling | Dry Run | Pending |