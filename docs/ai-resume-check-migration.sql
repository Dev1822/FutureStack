-- =============================================================================
-- FutureTracker AI Resume Checker Migration
-- Adds the resume_ai_checks table to store results from the agentic
-- AI resume evaluation pipeline (powered by interviewstreet/hiring-agent
-- architecture, MIT © HackerRank, reimplemented in Node.js).
--
-- Run this AFTER the documents migration (documents-migration.sql).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- resume_ai_checks table
-- Stores one row per AI check run for a document.
-- Multiple runs are preserved (e.g. after the user updates their resume).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS resume_ai_checks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    document_id     UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,

    -- Pipeline status
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'running', 'completed', 'failed')),

    -- LLM provider info
    provider        TEXT,        -- e.g. 'gemini', 'ollama'
    model           TEXT,        -- e.g. 'gemini-2.0-flash', 'llama3.2'

    -- Scores (NULL until status = 'completed')
    overall_score   INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),

    -- Category scores: { open_source, self_projects, production, technical_skills }
    category_scores JSONB,

    -- Bonus / deduction points
    bonus           INTEGER DEFAULT 0,
    deductions      INTEGER DEFAULT 0,

    -- Structured resume (JSON Resume-style object extracted by the parser stage)
    structured_resume JSONB,

    -- GitHub enrichment data (null if no GitHub profile found)
    github_summary  JSONB,

    -- Evaluation output
    strengths       JSONB,    -- array of strength strings
    suggestions     JSONB,    -- array of actionable improvement strings
    evidence        JSONB,    -- per-category evidence strings

    -- Error message when status = 'failed'
    error           TEXT,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE resume_ai_checks ENABLE ROW LEVEL SECURITY;

-- Users can only read their own checks
CREATE POLICY "Users can view own ai checks" ON resume_ai_checks
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users
            WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

-- Users can create checks for themselves
CREATE POLICY "Users can create own ai checks" ON resume_ai_checks
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users
            WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

-- Users can update their own checks (e.g. status transitions)
CREATE POLICY "Users can update own ai checks" ON resume_ai_checks
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM users
            WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

-- Users can delete their own checks
CREATE POLICY "Users can delete own ai checks" ON resume_ai_checks
    FOR DELETE USING (
        user_id IN (
            SELECT id FROM users
            WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );


-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Fast lookup by user
CREATE INDEX IF NOT EXISTS idx_resume_ai_checks_user_id
    ON resume_ai_checks(user_id);

-- Fast lookup by document (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_resume_ai_checks_document_id
    ON resume_ai_checks(document_id);

-- Latest-first ordering per document
CREATE INDEX IF NOT EXISTS idx_resume_ai_checks_document_created
    ON resume_ai_checks(document_id, created_at DESC);


-- ---------------------------------------------------------------------------
-- updated_at trigger (reuses existing update_updated_at_column function)
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS update_resume_ai_checks_updated_at ON resume_ai_checks;
CREATE TRIGGER update_resume_ai_checks_updated_at
    BEFORE UPDATE ON resume_ai_checks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
