-- =============================================================================
-- Dashboard Share Links
-- =============================================================================
-- Adds revocable, optional-passcode share links for public read-only dashboard
-- snapshots. Public viewers should access snapshots through the Express API,
-- which verifies token/passcode state and returns a redacted response.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'share_snapshot_type') THEN
    CREATE TYPE share_snapshot_type AS ENUM ('frozen', 'live');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  token_ciphertext TEXT,
  token_iv TEXT,
  token_auth_tag TEXT,
  snapshot JSONB NOT NULL,
  snapshot_type share_snapshot_type NOT NULL DEFAULT 'frozen',
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  view_count INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  passcode_hash TEXT,
  passcode_salt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT share_links_passcode_pair CHECK (
    (passcode_hash IS NULL AND passcode_salt IS NULL)
    OR (passcode_hash IS NOT NULL AND passcode_salt IS NOT NULL)
  ),
  CONSTRAINT share_links_encrypted_token_triplet CHECK (
    (token_ciphertext IS NULL AND token_iv IS NULL AND token_auth_tag IS NULL)
    OR (token_ciphertext IS NOT NULL AND token_iv IS NOT NULL AND token_auth_tag IS NOT NULL)
  )
);

ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own share links" ON share_links;
CREATE POLICY "Users can view own share links" ON share_links
  FOR SELECT TO authenticated
  USING (user_id IN (
    SELECT id FROM users
    WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

DROP POLICY IF EXISTS "Users can create own share links" ON share_links;
CREATE POLICY "Users can create own share links" ON share_links
  FOR INSERT TO authenticated
  WITH CHECK (user_id IN (
    SELECT id FROM users
    WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

DROP POLICY IF EXISTS "Users can update own share links" ON share_links;
CREATE POLICY "Users can update own share links" ON share_links
  FOR UPDATE TO authenticated
  USING (user_id IN (
    SELECT id FROM users
    WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ))
  WITH CHECK (user_id IN (
    SELECT id FROM users
    WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

DROP POLICY IF EXISTS "Users can delete own share links" ON share_links;
CREATE POLICY "Users can delete own share links" ON share_links
  FOR DELETE TO authenticated
  USING (user_id IN (
    SELECT id FROM users
    WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

CREATE INDEX IF NOT EXISTS idx_share_links_user_id ON share_links(user_id);
CREATE INDEX IF NOT EXISTS idx_share_links_token_hash ON share_links(token_hash);
CREATE INDEX IF NOT EXISTS idx_share_links_active_token_hash
  ON share_links(token_hash)
  WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_share_links_user_created_at
  ON share_links(user_id, created_at DESC);

DROP TRIGGER IF EXISTS update_share_links_updated_at ON share_links;
CREATE TRIGGER update_share_links_updated_at
  BEFORE UPDATE ON share_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
