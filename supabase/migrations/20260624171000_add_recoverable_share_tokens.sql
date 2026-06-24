-- Add encrypted raw-token storage for owner-side re-copy of share URLs.
-- Public lookups continue to use token_hash.

ALTER TABLE share_links ADD COLUMN IF NOT EXISTS token_ciphertext TEXT;
ALTER TABLE share_links ADD COLUMN IF NOT EXISTS token_iv TEXT;
ALTER TABLE share_links ADD COLUMN IF NOT EXISTS token_auth_tag TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'share_links_encrypted_token_triplet'
  ) THEN
    ALTER TABLE share_links ADD CONSTRAINT share_links_encrypted_token_triplet CHECK (
      (token_ciphertext IS NULL AND token_iv IS NULL AND token_auth_tag IS NULL)
      OR (token_ciphertext IS NOT NULL AND token_iv IS NOT NULL AND token_auth_tag IS NOT NULL)
    );
  END IF;
END $$;
