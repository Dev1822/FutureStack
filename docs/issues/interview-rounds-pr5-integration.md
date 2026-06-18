### Summary

Wire interview rounds into the **internship opportunity UX** — detail modal, card badge, API service layer.

**Status:** Implemented. UI updates from mutation response without blocking refetch.

### User flow

1. User opens internship in `OpportunityDetailModal`
2. Section: **Interview pipeline** with `RoundTimeline`
3. **Add round** / **Edit round** opens `AddRoundModal`
4. Save calls API → `applyRoundMutationResult()` updates timeline + card badges immediately
5. `OpportunityCard` shows compact line: e.g. `Round 2 · In progress` or `Rejected at Round 1`

### API service

`src/services/api.js`:

```js
export const roundService = {
  list(opportunityId) { ... },
  create(opportunityId, data) { ... },   // returns { round, opportunity, rounds }
  update(opportunityId, roundId, data) { ... },
  delete(opportunityId, roundId) { ... },
};
```

**Do not** add Supabase queries in `src/lib/supabase.js` for rounds.

### Performance (UX)

**Before:** After create, modal waited for `getById` + `list` refetch before closing.

**After:** `handleRoundSubmit` applies `{ round, opportunity, rounds }` from the mutation response, closes modal, shows toast — no extra HTTP calls.

### Status board / filters

- Kanban columns still use `opportunities.status` (auto-synced by API)
- `InternshipList` passes `onOpportunityUpdated` to refresh card badges in the list

### Files

- `src/services/api.js` — `roundService`
- `src/components/rounds/RoundTimeline.jsx`
- `src/components/rounds/AddRoundModal.jsx`
- `src/utils/roundHelpers.js`
- `src/components/opportunities/OpportunityDetailModal.jsx`
- `src/components/opportunities/OpportunityCard.jsx`
- `src/pages/InternshipList.jsx`

### Acceptance criteria

- [x] End-to-end: add rounds, mark rejected → status + banner + card update
- [x] Hackathon opportunities do not show rounds UI
- [x] `npm run test:ci` and `npm run check:architecture` pass
- [x] Round save feels responsive (no blocking refetch)

### Docs

- [`docs/interview-rounds.md`](../interview-rounds.md)
