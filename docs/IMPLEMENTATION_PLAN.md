# BetterPhone Survey - Implementation Plan

## Current Phase: Phase 2 Backend

### Architecture
```
Frontend (Vercel) → Supabase (DB + Storage) → OpenAI (Whisper + GPT)
                  → PostHog (Analytics)
```

### Zero-Cost Stack
- Supabase Free Tier
- PostHog Free Tier (1M events + 5K sessions/mo)
- Vercel Free Tier
- GA4 (unlimited, free)

---

## Database Schema

```sql
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  email TEXT,
  completed BOOLEAN DEFAULT FALSE,
  current_step TEXT DEFAULT 'intro',
  form_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE voice_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT REFERENCES survey_responses(session_id),
  step_number INTEGER NOT NULL,
  file_path TEXT,
  duration_seconds INTEGER,
  transcript TEXT,
  extracted_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Implementation Order

1. Database schema + Supabase setup
2. Supabase client + auto-save
3. PostHog + GA4 integration
4. Voice recorder UI + upload
5. Whisper transcription function
6. GPT extraction + prompts
7. Vercel deployment
