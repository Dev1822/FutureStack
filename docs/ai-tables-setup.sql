-- =============================================================================
-- AI Resume Checker + BYOK — one-time setup
-- Paste this entire file into Supabase Dashboard → SQL Editor → Run.
-- Creates: resume_ai_checks, user_ai_settings
-- Safe to re-run if a previous attempt stopped partway through.
-- =============================================================================

-- AI Resume Checker + BYOK user AI settings

CREATE TABLE IF NOT EXISTS resume_ai_checks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    document_id     UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    provider        TEXT,
    model           TEXT,
    overall_score   INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    category_scores JSONB,
    bonus           INTEGER DEFAULT 0,
    deductions      INTEGER DEFAULT 0,
    structured_resume JSONB,
    github_summary  JSONB,
    strengths       JSONB,
    suggestions     JSONB,
    evidence        JSONB,
    error           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE resume_ai_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own ai checks" ON resume_ai_checks;
CREATE POLICY "Users can view own ai checks" ON resume_ai_checks
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users
            WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

DROP POLICY IF EXISTS "Users can create own ai checks" ON resume_ai_checks;
CREATE POLICY "Users can create own ai checks" ON resume_ai_checks
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users
            WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

DROP POLICY IF EXISTS "Users can update own ai checks" ON resume_ai_checks;
CREATE POLICY "Users can update own ai checks" ON resume_ai_checks
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM users
            WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

DROP POLICY IF EXISTS "Users can delete own ai checks" ON resume_ai_checks;
CREATE POLICY "Users can delete own ai checks" ON resume_ai_checks
    FOR DELETE USING (
        user_id IN (
            SELECT id FROM users
            WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

CREATE INDEX IF NOT EXISTS idx_resume_ai_checks_user_id
    ON resume_ai_checks(user_id);

CREATE INDEX IF NOT EXISTS idx_resume_ai_checks_document_id
    ON resume_ai_checks(document_id);

CREATE INDEX IF NOT EXISTS idx_resume_ai_checks_document_created
    ON resume_ai_checks(document_id, created_at DESC);

DROP TRIGGER IF EXISTS update_resume_ai_checks_updated_at ON resume_ai_checks;
CREATE TRIGGER update_resume_ai_checks_updated_at
    BEFORE UPDATE ON resume_ai_checks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS user_ai_settings (
    user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    provider            TEXT NOT NULL DEFAULT 'gemini'
                            CHECK (provider IN ('gemini', 'ollama')),
    model               TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
    api_key_ciphertext  TEXT NOT NULL,
    api_key_iv          TEXT NOT NULL,
    api_key_auth_tag    TEXT NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_ai_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own ai settings" ON user_ai_settings;
CREATE POLICY "Users can view own ai settings" ON user_ai_settings
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users
            WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

DROP POLICY IF EXISTS "Users can insert own ai settings" ON user_ai_settings;
CREATE POLICY "Users can insert own ai settings" ON user_ai_settings
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users
            WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

DROP POLICY IF EXISTS "Users can update own ai settings" ON user_ai_settings;
CREATE POLICY "Users can update own ai settings" ON user_ai_settings
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM users
            WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

DROP POLICY IF EXISTS "Users can delete own ai settings" ON user_ai_settings;
CREATE POLICY "Users can delete own ai settings" ON user_ai_settings
    FOR DELETE USING (
        user_id IN (
            SELECT id FROM users
            WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

DROP TRIGGER IF EXISTS update_user_ai_settings_updated_at ON user_ai_settings;
CREATE TRIGGER update_user_ai_settings_updated_at
    BEFORE UPDATE ON user_ai_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
