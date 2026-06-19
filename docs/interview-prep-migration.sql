-- =============================================================================
-- FutureTracker Interview Preparation Migration
-- Interview preparation workspace for internships
-- =============================================================================

-- =============================================================================
-- Interview Prep main table (linked to opportunities where category = 'internship')
-- =============================================================================

CREATE TABLE IF NOT EXISTS interview_prep (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE NOT NULL UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  company_research TEXT,
  reflection_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on interview_prep table
ALTER TABLE interview_prep ENABLE ROW LEVEL SECURITY;

-- Users can only view their own interview prep
CREATE POLICY "Users can view own interview_prep" ON interview_prep
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub')
  );

-- Users can create interview prep for their own internships
CREATE POLICY "Users can create own interview_prep" ON interview_prep
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub')
    AND opportunity_id IN (
      SELECT id FROM opportunities
      WHERE user_id = interview_prep.user_id
        AND category = 'internship'
    )
  );

-- Users can update their own interview prep
CREATE POLICY "Users can update own interview_prep" ON interview_prep
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub')
  );

-- Users can delete their own interview prep
CREATE POLICY "Users can delete own interview_prep" ON interview_prep
  FOR DELETE USING (
    user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub')
  );

-- =============================================================================
-- Interview Questions table
-- =============================================================================

CREATE TABLE IF NOT EXISTS interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prep_id UUID REFERENCES interview_prep(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  is_prepared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on interview_questions table
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;

-- Users can view questions for their own prep
CREATE POLICY "Users can view own interview_questions" ON interview_questions
  FOR SELECT USING (
    prep_id IN (
      SELECT id FROM interview_prep WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Users can create questions for their own prep
CREATE POLICY "Users can create own interview_questions" ON interview_questions
  FOR INSERT WITH CHECK (
    prep_id IN (
      SELECT id FROM interview_prep WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Users can update questions for their own prep
CREATE POLICY "Users can update own interview_questions" ON interview_questions
  FOR UPDATE USING (
    prep_id IN (
      SELECT id FROM interview_prep WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Users can delete questions from their own prep
CREATE POLICY "Users can delete own interview_questions" ON interview_questions
  FOR DELETE USING (
    prep_id IN (
      SELECT id FROM interview_prep WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- =============================================================================
-- Technical Topics table
-- =============================================================================

CREATE TABLE IF NOT EXISTS technical_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prep_id UUID REFERENCES interview_prep(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  is_reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on technical_topics table
ALTER TABLE technical_topics ENABLE ROW LEVEL SECURITY;

-- Users can view topics for their own prep
CREATE POLICY "Users can view own technical_topics" ON technical_topics
  FOR SELECT USING (
    prep_id IN (
      SELECT id FROM interview_prep WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Users can create topics for their own prep
CREATE POLICY "Users can create own technical_topics" ON technical_topics
  FOR INSERT WITH CHECK (
    prep_id IN (
      SELECT id FROM interview_prep WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Users can update topics for their own prep
CREATE POLICY "Users can update own technical_topics" ON technical_topics
  FOR UPDATE USING (
    prep_id IN (
      SELECT id FROM interview_prep WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Users can delete topics from their own prep
CREATE POLICY "Users can delete own technical_topics" ON technical_topics
  FOR DELETE USING (
    prep_id IN (
      SELECT id FROM interview_prep WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- =============================================================================
-- Behavioral Prep table (STAR method)
-- =============================================================================

CREATE TABLE IF NOT EXISTS behavioral_prep (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prep_id UUID REFERENCES interview_prep(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  situation TEXT,
  task TEXT,
  action TEXT,
  result TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on behavioral_prep table
ALTER TABLE behavioral_prep ENABLE ROW LEVEL SECURITY;

-- Users can view behavioral prep for their own prep
CREATE POLICY "Users can view own behavioral_prep" ON behavioral_prep
  FOR SELECT USING (
    prep_id IN (
      SELECT id FROM interview_prep WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Users can create behavioral prep for their own prep
CREATE POLICY "Users can create own behavioral_prep" ON behavioral_prep
  FOR INSERT WITH CHECK (
    prep_id IN (
      SELECT id FROM interview_prep WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Users can update behavioral prep for their own prep
CREATE POLICY "Users can update own behavioral_prep" ON behavioral_prep
  FOR UPDATE USING (
    prep_id IN (
      SELECT id FROM interview_prep WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Users can delete behavioral prep from their own prep
CREATE POLICY "Users can delete own behavioral_prep" ON behavioral_prep
  FOR DELETE USING (
    prep_id IN (
      SELECT id FROM interview_prep WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- =============================================================================
-- Indexes for performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_interview_prep_opportunity_id ON interview_prep(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_interview_prep_user_id ON interview_prep(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_questions_prep_id ON interview_questions(prep_id);
CREATE INDEX IF NOT EXISTS idx_technical_topics_prep_id ON technical_topics(prep_id);
CREATE INDEX IF NOT EXISTS idx_technical_topics_priority ON technical_topics(priority);
CREATE INDEX IF NOT EXISTS idx_behavioral_prep_prep_id ON behavioral_prep(prep_id);

-- =============================================================================
-- Updated_at triggers
-- =============================================================================

DROP TRIGGER IF EXISTS update_interview_prep_updated_at ON interview_prep;
CREATE TRIGGER update_interview_prep_updated_at
  BEFORE UPDATE ON interview_prep
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interview_questions_updated_at ON interview_questions;
CREATE TRIGGER update_interview_questions_updated_at
  BEFORE UPDATE ON interview_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_technical_topics_updated_at ON technical_topics;
CREATE TRIGGER update_technical_topics_updated_at
  BEFORE UPDATE ON technical_topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_behavioral_prep_updated_at ON behavioral_prep;
CREATE TRIGGER update_behavioral_prep_updated_at
  BEFORE UPDATE ON behavioral_prep
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
