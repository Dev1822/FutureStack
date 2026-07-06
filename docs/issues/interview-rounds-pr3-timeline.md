### Summary

Presentational **RoundTimeline** component — vertical stepper showing each round's type, date, and result.

**Status:** ✅ Implemented — `src/components/rounds/RoundTimeline.jsx`

**Docs:** [`docs/interview-rounds.md`](../interview-rounds.md)

### Props

```jsx
<RoundTimeline
  rounds={rounds}           // sorted by round_number
  currentRoundNumber={2}    // optional highlight
  rejectedRoundNumber={null}
/>
```

### UI requirements

- Each step: round number, type label, scheduled date, result badge
- Result colors (Tailwind):
  - `pending` → blue
  - `cleared` → green
  - `rejected` → red
  - `skipped` → gray
- Banner: **"Rejected at Round N"** when `rejectedRoundNumber` set
- Banner: **"Preparing for Round N"** when latest result is `pending`
- Empty state: "No rounds yet — add your first round after applying"
- Accessible: list semantics, sufficient contrast on dark theme

### Files

- `src/components/rounds/RoundTimeline.jsx` (new)
- `src/components/rounds/RoundTimeline.test.jsx` (optional but encouraged — render with mock data)
- `src/utils/roundHelpers.js` (new) — `ROUND_TYPE_LABELS`, `RESULT_LABELS`, icons map

### Out of scope

- API calls
- Modals
- OpportunityCard integration

### Acceptance criteria

- [ ] Renders correctly with 0, 1, and 5 mock rounds
- [ ] Storybook not required; manual screenshot in PR is fine
- [ ] Uses Tailwind only (no `.css` file)
- [ ] `npm run test:ci` passes

### Depends on

PR1 (constants/types). **Can parallel PR2** using mocks.

### Blocks

PR5 integration
