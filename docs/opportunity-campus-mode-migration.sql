-- =============================================================================
-- FutureTracker Campus Mode Migration
-- Optional on-campus / off-campus flag for opportunities (#57)
-- =============================================================================

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS campus_mode TEXT
  CHECK (campus_mode IN ('on_campus', 'off_campus'));
