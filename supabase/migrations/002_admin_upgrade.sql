-- ============================================
-- Admin Portal Upgrade Migration
-- ============================================

-- Tags system
CREATE TABLE IF NOT EXISTS response_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS response_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES response_tags(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(response_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_tag_assignments_response ON response_tag_assignments(response_id);
CREATE INDEX IF NOT EXISTS idx_tag_assignments_tag ON response_tag_assignments(tag_id);

-- Admin notes
CREATE TABLE IF NOT EXISTS admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_response ON admin_notes(response_id);

-- AI insights cache
CREATE TABLE IF NOT EXISTS ai_insights_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type TEXT NOT NULL UNIQUE, -- UNIQUE constraint required for upsert
  data JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',
  response_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_insights_type ON ai_insights_cache(insight_type);
CREATE INDEX IF NOT EXISTS idx_insights_expires ON ai_insights_cache(expires_at);

-- Add AI summary columns to survey_responses
ALTER TABLE survey_responses
  ADD COLUMN IF NOT EXISTS ai_summary JSONB,
  ADD COLUMN IF NOT EXISTS ai_summary_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS furthest_step INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS survey_type TEXT DEFAULT 'parent';

-- Index for survey_type
CREATE INDEX IF NOT EXISTS idx_responses_type ON survey_responses(survey_type);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_responses_started_at ON survey_responses(started_at);
CREATE INDEX IF NOT EXISTS idx_responses_completed_at ON survey_responses(completed_at);
CREATE INDEX IF NOT EXISTS idx_responses_furthest_step ON survey_responses(furthest_step);

-- RLS for new tables
ALTER TABLE response_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights_cache ENABLE ROW LEVEL SECURITY;

-- Service role key bypasses RLS, but policies needed for completeness
CREATE POLICY "Admin full access tags" ON response_tags FOR ALL USING (true);
CREATE POLICY "Admin full access tag_assignments" ON response_tag_assignments FOR ALL USING (true);
CREATE POLICY "Admin full access notes" ON admin_notes FOR ALL USING (true);
CREATE POLICY "Admin full access insights" ON ai_insights_cache FOR ALL USING (true);
