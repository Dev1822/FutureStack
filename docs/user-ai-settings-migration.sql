-- =============================================================================
-- User AI Settings (BYOK) Migration
-- Stores encrypted LLM API keys per user for the AI Resume Checker.
-- Run in Supabase SQL Editor after ai-resume-check-migration.sql.
-- =============================================================================

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

CREATE POLICY "Users can view own ai settings" ON user_ai_settings
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users
            WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

CREATE POLICY "Users can insert own ai settings" ON user_ai_settings
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users
            WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

CREATE POLICY "Users can update own ai settings" ON user_ai_settings
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM users
            WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
        )
    );

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
