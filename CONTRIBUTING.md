# Contributing to OIPP

## 1. Branching Strategy

Create a separate branch for every assigned issue. Use the following naming convention:

- `docs/<issue-id>-<short-description>` for documentation tasks
- `feat/<issue-id>-<short-description>` for features
- `fix/<issue-id>-<short-description>` for bug fixes
- `test/<issue-id>-<short-description>` for testing tasks

Always start from the latest `main` branch.

## 2. Commit Messages

Use clear, descriptive commit messages. Include the issue ID and requirement IDs where applicable.

Example: `docs(S0-01): add project documentation`

## 3. Pull Requests and Reviews

- Each assignee creates a pull request for their assigned issue.
- Reference the relevant issue and requirements in the pull request.
- Explain what changed and how it was verified.
- Mention any AI tools used during development.
- Ensure CI checks pass before merging.
- The repository owner, Namitha, reviews and merges team members' pull requests using a merge commit.
- Koushik reviews Namitha's pull requests.
- Do not merge your own pull request without the required review.

## 4. Definition of Done

An issue is complete when:

- All acceptance criteria are satisfied.
- Changes follow the agreed specifications.
- Relevant tests pass, where applicable.
- Documentation is updated when necessary.
- No secrets, `.env` files, or `node_modules` are committed.
- The pull request has the required review and passing checks.

## 5. Sprint Schedule

| Milestone | Dates |
|---|---|
| Dry Run | 12–16 October 2026 |
| Sprint 1 | 19–23 October 2026 |
| Sprint 2 | 26–30 October 2026 |
| Feature Freeze | 30 October 2026 |

## 6. Scope

Follow `CLAUDE.md` and `SOURCE_OF_TRUTH.md` as the project's agreed technical and requirements references. Record implementation differences in `docs/DEVIATIONS.md`.