-- =============================================================================
-- Patch: add resume_shortlisted and technical_assignment round types
-- Run in Supabase SQL Editor if opportunity_rounds already exists.
-- =============================================================================

ALTER TABLE opportunity_rounds
  DROP CONSTRAINT IF EXISTS opportunity_rounds_round_type_check;

ALTER TABLE opportunity_rounds
  ADD CONSTRAINT opportunity_rounds_round_type_check
  CHECK (round_type IN (
    'resume_shortlisted',
    'oa',
    'assignment',
    'technical_assignment',
    'technical',
    'hr',
    'group_discussion',
    'managerial',
    'final',
    'other'
  ));
