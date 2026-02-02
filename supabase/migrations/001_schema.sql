-- BetterPhone Survey Database Schema
-- Run this in your Supabase SQL Editor

-- Survey responses table
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  form_data JSONB DEFAULT '{}',
  current_step TEXT DEFAULT 'intro',
  is_completed BOOLEAN DEFAULT FALSE,
  email TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for common queries
  CONSTRAINT valid_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Voice recordings table
CREATE TABLE IF NOT EXISTS voice_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  duration INTEGER DEFAULT 0,
  transcript TEXT,
  extracted_data JSONB,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  
  -- Foreign key to survey_responses
  CONSTRAINT fk_session FOREIGN KEY (session_id) REFERENCES survey_responses(session_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_responses_session ON survey_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_completed ON survey_responses(is_completed);
CREATE INDEX IF NOT EXISTS idx_recordings_session ON voice_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_recordings_status ON voice_recordings(processing_status);

-- Enable Row Level Security
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_recordings ENABLE ROW LEVEL SECURITY;

-- Public insert policy (anyone can submit surveys)
CREATE POLICY "Allow public inserts" ON survey_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public updates" ON survey_responses FOR UPDATE USING (true);
CREATE POLICY "Allow public inserts" ON voice_recordings FOR INSERT WITH CHECK (true);

-- Read policy (only authenticated admins can read)
CREATE POLICY "Admin read access" ON survey_responses FOR SELECT 
  USING (auth.role() = 'authenticated');
CREATE POLICY "Admin read access" ON voice_recordings FOR SELECT 
  USING (auth.role() = 'authenticated');
