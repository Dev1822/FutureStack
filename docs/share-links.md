# Dashboard Share Links

FutureStack supports opt-in, read-only placement dashboard sharing through unique links at `/share/:token`.

## User Flow

1. The signed-in owner opens `/dashboard` and clicks **Share Dashboard**.
2. The owner selects all internships or specific internships.
3. The owner chooses visible fields: status, rejected round, and date applied.
4. The owner chooses an expiry: 24 hours, 7 days, or permanent.
5. The owner can optionally require a 4-digit passcode.
6. The API returns the raw link once. The dashboard later shows only metadata and revoke controls.
7. Viewers open `/share/:token` without signing in.

## Privacy Model

Share links expose a frozen, redacted snapshot only. Public responses never include:

- `user_id`
- owner name or email
- opportunity notes
- documents or file URLs
- interview prep data
- raw token or token hash
- passcode hash or salt

Tokens are generated server-side and stored as `token_hash`. Optional passcodes are salted and hashed server-side. Public pages call the Express API, not Supabase directly, so token lookup, expiry, revocation, passcode checks, and view-count increments stay server-enforced.

## Data Model

Migration files:

- `docs/share-links-migration.sql`
- `supabase/migrations/20260624163000_create_share_links.sql`

Table: `share_links`

| Column | Purpose |
|--------|---------|
| `id` | Share row ID |
| `user_id` | Owner, references `users(id)` |
| `token_hash` | Unique SHA-256 hash of raw share token |
| `snapshot` | Frozen redacted dashboard payload |
| `snapshot_type` | `frozen` now, `live` reserved for future work |
| `expires_at` | Nullable expiry |
| `is_active` | Revoke flag |
| `view_count` | Public successful views |
| `passcode_hash`, `passcode_salt` | Optional passcode protection |

RLS is enabled with owner-only authenticated policies. Public viewing is handled by backend routes with the service role; do not add permissive public policies on `opportunities`.

## API Routes

Protected routes:

- `GET /api/share-links` — list current user share metadata.
- `POST /api/share-links` — create a share and return the raw URL once.
- `DELETE /api/share-links/:id` — revoke a share.

Public routes:

- `GET /api/public/share-links/:token` — fetch public snapshot, or return passcode-required / revoked / expired state.
- `POST /api/public/share-links/:token/verify` — verify passcode and return public snapshot.

## Manual Verification

Run automated checks first:

```bash
npm run test:ci
npm run build
cd backend && npm test && cd ..
npm run check:architecture
```

Then smoke test:

1. Start backend and frontend locally.
2. Sign in and add several internships with different statuses.
3. Open `/dashboard`, generate a share link for all internships, and copy the URL.
4. Open the URL in a signed-out or private browser session.
5. Generate a passcode-protected share and verify wrong and correct passcodes.
6. Revoke a share from the dashboard and confirm the public URL shows the expired/revoked page.
7. Check mobile layout for the modal, manage panel, passcode gate, and public snapshot.
