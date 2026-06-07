# Contributing to FutureStack

Thank you for contributing to FutureStack through **GirlScript Summer of Code (GSSoC) 2026** and the wider open-source community.

## Before you start

1. Read the [README](README.md) and skim [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md) for architecture context.
2. Pick **one open issue** you want to work on.
3. **Do not open a PR** until a maintainer has assigned the issue to you.
4. Comment on the issue with your approach (see below). Wait for assignment before coding.

## How to get an issue assigned

Comment on the issue with:

- **What you plan to change** — concrete behavior, not vague goals
- **Files you expect to touch** — list paths (e.g. `src/utils/dateHelpers.js`, `OpportunityCard.jsx`)
- **Libraries or patterns** — only if adding something new; prefer existing stack (React, Tailwind, Express, Supabase)
- **Test plan** — how you will verify it works locally
- **Dependencies** — if the issue depends on another issue or PR (e.g. share links require #18 first)

**Example:**

> I'll add `getDeadlineUrgency()` in `src/utils/dateHelpers.js` and use it in `OpportunityCard.jsx` and `DeadlineWidget.jsx`. No new libraries. I'll test with deadlines today, in 2 days, in 10 days, and expired.

Maintainers assign **one contributor per issue**. Assignment usually comes with a **7-day deadline** to open a draft or final PR.

## Development setup

```bash
git clone https://github.com/Venkat-Kolasani/FutureStack.git
cd FutureStack
npm install
cd backend && npm install && cd ..

# Terminal 1 — backend (port 3001)
cd backend && npm run dev

# Terminal 2 — frontend (port 3000)
npm start
```

Copy `.env.example` and `backend/.env.example` to `.env` files and fill in Clerk + Supabase credentials. See the README **Environment Variables** section.

## Pull request rules

- **One issue per PR** — no unrelated refactors or drive-by fixes
- **Reference the issue** — use `Fixes #123` in the PR description
- **Keep scope small** — if the issue grows, discuss with maintainers before expanding
- **Match existing style** — same component patterns, Tailwind tokens, error handling, and file layout
- **No secrets** — never commit `.env`, API keys, or service role keys
- **Database changes** — add SQL migration files under `docs/` (see existing `*-migration.sql` files)

### Before you request review

```bash
# Frontend tests
npm test -- --watchAll=false

# Manual smoke test: sign in, open the page(s) you changed, test happy path + one edge case
```

If you changed backend routes or validation, restart the backend and hit the affected endpoints with a valid Clerk JWT.

## What we look for in reviews

| ✅ Good | ❌ Will be rejected |
|--------|---------------------|
| Solves the issue acceptance criteria | UI-only change that doesn't meet criteria |
| Reuses existing helpers and components | Duplicates logic already in the codebase |
| Tested locally with clear steps | Copy-paste boilerplate with no testing |
| Minimal, focused diff | Large unrelated changes |
| Respects auth, RLS, and validation | Bypasses API or exposes user data |

## Issue dependencies (important)

Some features must be built in order:

| Feature | Order |
|---------|--------|
| **Placement dashboard sharing** (#17) | #18 DB → #19 modal / #20 public page → #21 manage shares → #22 passcode (optional) |
| **Light/dark theme** (#23) | Phase 1: infra + core layout only; full app migration is follow-up work |
| **Application readiness** (#25) | V1 uses existing Documents API — no new tables required |

Ask in the issue if you are unsure about scope.

## Labels (for maintainers & contributors)

| Label | Meaning |
|-------|---------|
| `gssoc` | GSSoC 2026 contribution |
| `good first issue` | Smaller scope, good for first PR |
| `enhancement` | New feature |
| `bug` | Fix broken behavior |
| `frontend` / `backend` / `fullstack` | Primary area |

## Code of conduct

Be respectful in issues and PRs. Maintainers may unassign or close work that ignores scope, duplicates another assignee's PR, or violates project security practices.

## Questions?

Open a comment on the relevant issue and tag `@Venkat-Kolasani`. For architecture questions, check [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md) first.
