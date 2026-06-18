### Summary

Backend CRUD for interview rounds + **status sync** on the parent opportunity.

**Status:** Implemented (merged). Performance optimized: mutations return `{ round, opportunity, rounds }` to avoid redundant DB reads and frontend refetches.

### API routes

Mount nested under opportunities (same pattern as hackathons):

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/opportunities/:opportunityId/rounds` | List rounds ordered by `round_number` |
| POST | `/api/opportunities/:opportunityId/rounds` | Add round (auto-assign next `round_number` if omitted) |
| PATCH | `/api/opportunities/:opportunityId/rounds/:roundId` | Update type, date, result, notes |
| DELETE | `/api/opportunities/:opportunityId/rounds/:roundId` | Delete round; re-sync opportunity fields |

All routes require auth. Verify opportunity belongs to user and `category === 'internship'`.

### Mutation response (POST / PATCH / DELETE)

```json
{
  "round": { ... },
  "opportunity": { "status": "interviewed", "current_round_number": 2, ... },
  "rounds": [ ... ]
}
```

The UI applies this payload directly — no follow-up `GET` for opportunity + rounds.

### Status sync helper

`backend/src/lib/syncOpportunityFromRounds.js`:

- After every round create/update/delete, recompute:
  - `opportunities.status`
  - `current_round_number`
  - `rejected_round_number`
- Accepts optional `{ existingStatus, rounds }` to **skip redundant SELECTs** when the route already loaded that data (performance fix).

### Create flow (optimized)

| Step | DB action |
|------|-----------|
| 1 | Verify opportunity (`id`, `category`, `status`) |
| 2 | List existing rounds (also used for next `round_number`) |
| 3 | Insert new round |
| 4 | Sync with preloaded data → single `UPDATE` on opportunity |

**Before:** 6 sequential Supabase calls. **After:** 4.

### Validation (Joi)

`backend/src/validation/rounds-schemas.js`:

- `round_type` enum
- `result` enum
- `scheduled_date` optional ISO date
- `notes` max 5000 chars
- `round_number` optional on create (server assigns max+1)

### Tests

- `backend/tests/integration/rounds.test.js`
  - 401 without auth
  - 404 wrong opportunity
  - 400 invalid round_type
  - Create → `res.body.round` + `res.body.opportunity.status === 'rejected'`
  - Reject hackathon opportunity → 400

### Files

- `backend/src/routes/opportunity-rounds.js`
- `backend/src/lib/syncOpportunityFromRounds.js`
- `backend/src/validation/rounds-schemas.js`
- `backend/tests/integration/rounds.test.js`

### Docs

- [`docs/interview-rounds.md`](../interview-rounds.md) — interview talking points + performance fix

### Acceptance criteria

- [x] All endpoints work with Clerk JWT
- [x] Status sync covered by integration tests
- [x] `cd backend && npm test` passes
- [x] Mutations return unified payload for fast UI updates
