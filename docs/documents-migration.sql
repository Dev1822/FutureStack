-- =============================================================================
-- FutureTracker Documents Feature Migration
-- Phase 1.3: Resume/Portfolio Attachment
-- =============================================================================

-- Documents table (user's document library)
-- Stores metadata for uploaded files and external links
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('resume', 'cover_letter', 'portfolio', 'other')) NOT NULL,
  file_url TEXT,                       -- Supabase Storage URL or external link
  file_size INTEGER,                   -- Size in bytes (for uploaded files)
  storage_path TEXT,                   -- Supabase Storage path (for deletion)
  version TEXT DEFAULT 'v1',           -- User-defined version label
  ats_score INTEGER,                    -- Rule-based ATS score from client-side analysis
  ats_analyzed_at TIMESTAMPTZ,          -- When client-side ATS analysis was last saved
  ats_analysis JSONB,                  -- Raw client-side ATS analysis metadata
  notes TEXT,
  is_external BOOLEAN DEFAULT FALSE,   -- True for portfolio links, false for uploads
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Users can only view their own documents
CREATE POLICY "Users can view own documents" ON documents
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub')
  );

-- Users can create their own documents
CREATE POLICY "Users can create own documents" ON documents
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub')
  );

-- Users can update their own documents
CREATE POLICY "Users can update own documents" ON documents
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub')
  );

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents" ON documents
  FOR DELETE USING (
    user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub')
  );


-- =============================================================================
-- Junction table: which document was used for which opportunity
-- =============================================================================

CREATE TABLE IF NOT EXISTS opportunity_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(opportunity_id, document_id)
);

-- Enable RLS on opportunity_documents table
ALTER TABLE opportunity_documents ENABLE ROW LEVEL SECURITY;

-- Users can only view their own opportunity-document links
-- (implicitly through opportunity ownership)
CREATE POLICY "Users can view own opportunity_documents" ON opportunity_documents
  FOR SELECT USING (
    opportunity_id IN (
      SELECT id FROM opportunities WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Users can create links for their own opportunities
CREATE POLICY "Users can create own opportunity_documents" ON opportunity_documents
  FOR INSERT WITH CHECK (
    opportunity_id IN (
      SELECT id FROM opportunities WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Users can delete their own links
CREATE POLICY "Users can delete own opportunity_documents" ON opportunity_documents
  FOR DELETE USING (
    opportunity_id IN (
      SELECT id FROM opportunities WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );


-- =============================================================================
-- Indexes for performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_opportunity_documents_opportunity_id ON opportunity_documents(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_documents_document_id ON opportunity_documents(document_id);


-- =============================================================================
-- Updated_at trigger for documents
-- =============================================================================

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- =============================================================================
-- Auto-unlink documents when opportunity status changes to 'rejected'
-- This trigger fires AFTER opportunity update and removes the document links
-- (from opportunity_documents table). The document files remain for reuse.
-- =============================================================================

CREATE OR REPLACE FUNCTION auto_unlink_documents_on_rejection()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run when status changes TO 'rejected'
  IF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
    -- Delete the links (documents themselves remain for potential reuse)
    DELETE FROM opportunity_documents WHERE opportunity_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS unlink_documents_on_rejection ON opportunities;
CREATE TRIGGER unlink_documents_on_rejection
  AFTER UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION auto_unlink_documents_on_rejection();


-- =============================================================================
-- Supabase Storage Bucket (run in Supabase Dashboard > SQL Editor)
-- This creates a private bucket for document uploads
-- =============================================================================

-- Note: Storage bucket creation is typically done via Supabase Dashboard or API
-- The following is for documentation purposes:
-- 
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create a new bucket called "documents"
-- 3. Set it to PRIVATE (not public)
-- 4. Add the following RLS policy for the bucket:
--
--    Policy name: "Users can upload own documents"
--    Target roles: authenticated
--    WITH CHECK expression:
--      (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text)
--
--    Policy name: "Users can read own documents"
--    Target roles: authenticated
--    USING expression:
--      (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text)
--
--    Policy name: "Users can delete own documents"
--    Target roles: authenticated
--    USING expression:
--      (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text)
