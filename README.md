# Online Internship and Placement Preparation Portal (OIPP)

A web-based platform that gives students a single place to discover internship opportunities, apply for them, take aptitude tests, track preparation progress, and view performance analysis. Administrators manage internship listings, aptitude tests, and questions through a dedicated admin interface.

> **Actors:** Student · Administrator
> **No recruiter/company actor. No Python service** — analysis runs inside Node.js (ADR-07).

---

## Team

| Name | GitHub username | Role | Responsibilities |
|---|---|---|---|
| Namitha R | [@namithar18](https://github.com/namithar18) | Member 1 · SRS & Requirements Lead · Repository Owner | Scope, actors, modules, FR/NFR, security objectives & requirements, SRS document |
| Manu Kudukundi | [@kmanu28](https://github.com/kmanu28) | Member 2 · Test Plan Lead | Test Plan, functional & NFR testing, security validation, test cases, SRS-to-test traceability |
| Kavana P G | [@kavanapg276-glitch](https://github.com/kavanapg276-glitch) | Member 3 · Architecture & Design Lead | Architecture pattern, component diagram, security architecture, sequence diagrams, API design, error handling |
| Koushik | [@Koushik504](https://github.com/Koushik504) | Member 4 · UML, Security & Integration Lead · PR reviewer for Member 1 | Use case diagram, sequence diagrams, security documentation, diagram consistency, cross-document traceability |

---

## Technology Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js **22 LTS** (`.nvmrc` → `22`) |
| Backend | Express **4.21.x**, CommonJS (`require`) |
| Database / ODM | MongoDB **7**, Mongoose **8.x** |
| Auth | `jsonwebtoken` 9.x · `bcryptjs` 2.4.x (10 rounds) |
| Validation | `zod` 3.x |
| Security | `helmet` 8.x · `cors` 2.x · `express-rate-limit` 7.x |
| Frontend | React **18** · Vite **5** · `react-router-dom` 6 · `axios` 1.x |
| Charts | `recharts` 2.x (analysis page only) |
| Styling | Plain CSS — design tokens in `client/src/styles/global.css` |
| Server tests | Jest 29.x · Supertest 7.x · `mongodb-memory-server` 10.x |
| Client tests | Vitest 2.x · `@testing-library/react` · `jsdom` |
| CI | GitHub Actions (`.github/workflows/ci.yml`) |

---

## Project Documents

| Document | Description |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Master build specification — read before writing any code |
| [`AGENTS.md`](AGENTS.md) | Mirror of `CLAUDE.md` for AI coding assistants |
| [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md) | Single source of truth: requirements, API, architecture, decisions |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Branching, commit, PR, and sprint rules |
| [`docs/DEVIATIONS.md`](docs/DEVIATIONS.md) | Every difference from the SRS / SAD / Test Plan |
| [GitHub Project / Backlog](../../projects) | _(link to your GitHub Project board — update when created)_ |

---

## Getting Started

> ⚠️ **These steps are placeholders.** Commands will be verified and updated once the relevant implementation is complete. Do not treat them as tested instructions until this notice is removed.

### Prerequisites

- Node.js 22 LTS — use [nvm](https://github.com/nvm-sh/nvm): `nvm use` (reads `.nvmrc`)
- MongoDB 7 Community Server running locally **or** an Atlas free-tier connection string

### 1 — Clone and install dependencies

```bash
# Clone
git clone <repo-url>
cd online-internship-placement-portal-1

# Install root, server, and client dependencies
npm install          # root (concurrently scripts)
cd server && npm install
cd ../client && npm install
```

### 2 — Configure environment variables

```bash
# Copy the example file and fill in your values
cp server/.env.example server/.env
```

Edit `server/.env`:

```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/oipp
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=3600
CLIENT_ORIGIN=http://localhost:5173
```

> `MONGODB_URI` and `JWT_SECRET` are required — the server will refuse to start without them.

### 3 — Seed the database

```bash
# Run from the repo root (placeholder — verify once seed.js is implemented)
npm run seed
```

The seed script creates at least one admin account. Admin accounts **cannot** be created through the registration form.

### 4 — Run the application

```bash
# Start both server (port 5000) and client (port 5173) concurrently
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5 — Run tests

```bash
# Server tests (Jest + mongodb-memory-server)
cd server && npm test

# Client tests (Vitest)
cd client && npm test

# Or from the repo root
npm test
```

> CI runs these automatically on every pull request. Both suites must pass before merging.

---

## Repository Layout (summary)

```
/
├── CLAUDE.md / AGENTS.md   # build contract
├── SOURCE_OF_TRUTH.md       # requirements & design baseline
├── CONTRIBUTING.md          # team workflow
├── server/                  # Node.js + Express API (modules M1–M7)
│   ├── src/
│   └── tests/
├── client/                  # React 18 + Vite SPA
│   └── src/
└── docs/
    ├── DEVIATIONS.md
    ├── SECURITY_VALIDATION.md
    ├── TEST_EXECUTION_REPORT.md
    └── api/OIPP.postman_collection.json
```

See [`CLAUDE.md §3`](CLAUDE.md#3-repository-layout) for the full directory tree.

---

## Sprint Schedule

| Milestone | Dates |
|---|---|
| Dry Run | 12–16 October 2026 |
| Sprint 1 | 19–23 October 2026 |
| Sprint 2 | 26–30 October 2026 |
| Feature Freeze | 30 October 2026 |

---

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for branching strategy, commit message format, PR review rules, and the definition of done.

All implementation differences from the SRS / SAD / Test Plan must be recorded in [`docs/DEVIATIONS.md`](docs/DEVIATIONS.md) in the same PR that introduces them.
