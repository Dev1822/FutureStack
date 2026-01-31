-- =============================================================================
-- FutureTracker Hackathon Team Collaboration Migration
-- Phase 2: Team collaboration features for hackathons
-- =============================================================================

-- =============================================================================
-- Hackathon Teams table (linked to opportunities where category = 'hackathon')
-- =============================================================================

CREATE TABLE IF NOT EXISTS hackathon_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE NOT NULL UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on hackathon_teams table
ALTER TABLE hackathon_teams ENABLE ROW LEVEL SECURITY;

-- Users can only view their own teams
CREATE POLICY "Users can view own hackathon_teams" ON hackathon_teams
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub')
  );

-- Users can create teams for their own hackathons
CREATE POLICY "Users can create own hackathon_teams" ON hackathon_teams
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub')
  );

-- Users can update their own teams
CREATE POLICY "Users can update own hackathon_teams" ON hackathon_teams
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub')
  );

-- Users can delete their own teams
CREATE POLICY "Users can delete own hackathon_teams" ON hackathon_teams
  FOR DELETE USING (
    user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub')
  );


-- =============================================================================
-- Team Members table (simple name-based, no account linking)
-- =============================================================================

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES hackathon_teams(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Member',
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on team_members table
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Users can view members of their own teams
CREATE POLICY "Users can view own team_members" ON team_members
  FOR SELECT USING (
    team_id IN (
      SELECT id FROM hackathon_teams WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Users can add members to their own teams
CREATE POLICY "Users can create own team_members" ON team_members
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT id FROM hackathon_teams WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Users can update members in their own teams
CREATE POLICY "Users can update own team_members" ON team_members
  FOR UPDATE USING (
    team_id IN (
      SELECT id FROM hackathon_teams WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Users can delete members from their own teams
CREATE POLICY "Users can delete own team_members" ON team_members
  FOR DELETE USING (
    team_id IN (
      SELECT id FROM hackathon_teams WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );


-- =============================================================================
-- Brainstorm Ideas table
-- =============================================================================

CREATE TABLE IF NOT EXISTS brainstorm_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES hackathon_teams(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('feature', 'design', 'tech', 'other')) DEFAULT 'other',
  votes INTEGER DEFAULT 0,
  is_selected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on brainstorm_ideas table
ALTER TABLE brainstorm_ideas ENABLE ROW LEVEL SECURITY;

-- Users can view ideas for their own teams
CREATE POLICY "Users can view own brainstorm_ideas" ON brainstorm_ideas
  FOR SELECT USING (
    team_id IN (
      SELECT id FROM hackathon_teams WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Users can create ideas for their own teams
CREATE POLICY "Users can create own brainstorm_ideas" ON brainstorm_ideas
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT id FROM hackathon_teams WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Users can update ideas for their own teams
CREATE POLICY "Users can update own brainstorm_ideas" ON brainstorm_ideas
  FOR UPDATE USING (
    team_id IN (
      SELECT id FROM hackathon_teams WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Users can delete ideas from their own teams
CREATE POLICY "Users can delete own brainstorm_ideas" ON brainstorm_ideas
  FOR DELETE USING (
    team_id IN (
      SELECT id FROM hackathon_teams WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );


-- =============================================================================
-- Hackathon Tasks table
-- =============================================================================

CREATE TABLE IF NOT EXISTS hackathon_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES hackathon_teams(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,
  status TEXT CHECK (status IN ('todo', 'in_progress', 'done')) DEFAULT 'todo',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on hackathon_tasks table
ALTER TABLE hackathon_tasks ENABLE ROW LEVEL SECURITY;

-- Users can view tasks for their own teams
CREATE POLICY "Users can view own hackathon_tasks" ON hackathon_tasks
  FOR SELECT USING (
    team_id IN (
      SELECT id FROM hackathon_teams WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Users can create tasks for their own teams
CREATE POLICY "Users can create own hackathon_tasks" ON hackathon_tasks
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT id FROM hackathon_teams WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Users can update tasks for their own teams
CREATE POLICY "Users can update own hackathon_tasks" ON hackathon_tasks
  FOR UPDATE USING (
    team_id IN (
      SELECT id FROM hackathon_teams WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Users can delete tasks from their own teams
CREATE POLICY "Users can delete own hackathon_tasks" ON hackathon_tasks
  FOR DELETE USING (
    team_id IN (
      SELECT id FROM hackathon_teams WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );


-- =============================================================================
-- Submission Checklist table
-- =============================================================================

CREATE TABLE IF NOT EXISTS submission_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES hackathon_teams(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on submission_checklist table
ALTER TABLE submission_checklist ENABLE ROW LEVEL SECURITY;

-- Users can view checklist items for their own teams
CREATE POLICY "Users can view own submission_checklist" ON submission_checklist
  FOR SELECT USING (
    team_id IN (
      SELECT id FROM hackathon_teams WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Users can create checklist items for their own teams
CREATE POLICY "Users can create own submission_checklist" ON submission_checklist
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT id FROM hackathon_teams WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Users can update checklist items for their own teams
CREATE POLICY "Users can update own submission_checklist" ON submission_checklist
  FOR UPDATE USING (
    team_id IN (
      SELECT id FROM hackathon_teams WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Users can delete checklist items from their own teams
CREATE POLICY "Users can delete own submission_checklist" ON submission_checklist
  FOR DELETE USING (
    team_id IN (
      SELECT id FROM hackathon_teams WHERE user_id IN (
        SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );


-- =============================================================================
-- Indexes for performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_hackathon_teams_opportunity_id ON hackathon_teams(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_hackathon_teams_user_id ON hackathon_teams(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_brainstorm_ideas_team_id ON brainstorm_ideas(team_id);
CREATE INDEX IF NOT EXISTS idx_hackathon_tasks_team_id ON hackathon_tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_hackathon_tasks_status ON hackathon_tasks(status);
CREATE INDEX IF NOT EXISTS idx_submission_checklist_team_id ON submission_checklist(team_id);


-- =============================================================================
-- Updated_at triggers
-- =============================================================================

DROP TRIGGER IF EXISTS update_hackathon_teams_updated_at ON hackathon_teams;
CREATE TRIGGER update_hackathon_teams_updated_at
  BEFORE UPDATE ON hackathon_teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hackathon_tasks_updated_at ON hackathon_tasks;
CREATE TRIGGER update_hackathon_tasks_updated_at
  BEFORE UPDATE ON hackathon_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
