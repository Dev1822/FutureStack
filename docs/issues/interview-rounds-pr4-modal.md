### Summary

**AddRoundModal** (and edit mode) for creating/updating interview rounds.

**Status:** ✅ Implemented — `src/components/rounds/AddRoundModal.jsx`

**Docs:** [`docs/interview-rounds.md`](../interview-rounds.md)

**Blocked by:** PR1 schema. UI can be built with mock submit handler before PR2 merges.

### Fields

| Field | Control |
|-------|---------|
| Round type | Select: OA, Assignment, Technical Interview, HR Interview, Group Discussion, Managerial, Final Round, Other |
| Scheduled date | Date input (optional) |
| Result | Select: Pending, Cleared, Rejected, Skipped |
| Notes | Textarea (optional) |

### Behavior

- **Add mode:** title "Add Round N" where N = next round number (prop)
- **Edit mode:** pre-fill existing round; title "Edit Round N"
- Validate required round type
- On submit: call prop `onSubmit(payload)` — parent wires API in PR5
- Loading + error states on submit button
- Dark theme consistent with `Modal.jsx`

### Files

- `src/components/rounds/AddRoundModal.jsx` (new)
- Extend `src/utils/roundHelpers.js` if not created in PR3

### Out of scope

- Fetching rounds
- OpportunityCard / DetailModal wiring

### Acceptance criteria

- [ ] Add and edit modes work with mock `onSubmit`
- [ ] Form resets on close
- [ ] Keyboard accessible (focus trap via existing Modal)
- [ ] `npm run test:ci` passes

### Depends on

PR1. **Can parallel PR2 and PR3.**

### Blocks

PR5 integration
