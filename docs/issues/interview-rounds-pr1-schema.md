### Summary

Add Supabase schema for **interview round tracking** — foundation for all follow-up PRs.

**Status:** ✅ Merged (`docs/opportunity-rounds-migration.sql`)

**Docs:** [`docs/interview-rounds.md`](../interview-rounds.md)

### Tasks

- [ ] Add `docs/opportunity-rounds-migration.sql` (or finalize existing draft)
- [ ] Run migration on dev Supabase project
- [ ] Update `docs/DOCUMENTATION.md` ER diagram section with `opportunity_rounds`
- [ ] Update README database schema Mermaid if table list changes

### Schema

**New table: `opportunity_rounds`**

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `opportunity_id` | uuid FK → opportunities | CASCADE delete |
| `user_id` | uuid FK → users | RLS + ownership |
| `round_number` | integer ≥ 1 | unique per opportunity |
| `round_type` | text enum | `oa`, `assignment`, `technical`, `hr`, `group_discussion`, `managerial`, `final`, `other` |
| `scheduled_date` | date nullable | |
| `result` | text enum | `pending`, `cleared`, `rejected`, `skipped` (default `pending`) |
| `notes` | text nullable | |
| `created_at` / `updated_at` | timestamptz | reuse `update_updated_at_column` trigger |

**Alter `opportunities`:**

| Column | Type | Notes |
|--------|------|-------|
| `current_round_number` | integer nullable | active/upcoming round |
| `rejected_round_number` | integer nullable | set when rejected at a round |

**Do NOT add `current_stage`** — use existing `status` column (synced in PR2).

### RLS

- All CRUD scoped to authenticated user's `user_id`
- INSERT must target `category = 'internship'` opportunities owned by user

### Acceptance criteria

- [ ] Migration applies cleanly on empty and existing databases
- [ ] Indexes on `opportunity_id`, `user_id`, `scheduled_date`
- [ ] RLS policies tested manually in Supabase SQL editor
- [ ] No changes to frontend or API in this PR

### Files

- `docs/opportunity-rounds-migration.sql`
- `docs/DOCUMENTATION.md` (schema section)

### Depends on

Nothing — **merge this first**.

### Blocks

PR2 API, PR3 Timeline UI (mock data ok), PR4 Modal UI (mock data ok)
