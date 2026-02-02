# BetterPhone Survey - Task List

## Phase 1: Next.js Setup ✅
- [x] Initialize Next.js 14 with TypeScript, Tailwind
- [x] Configure glassmorphism theme
- [x] Install dependencies (Supabase, clsx)

## Phase 2: Components ✅
- [x] UI: Button, GlassCard, RadioGroup, CheckboxGroup
- [x] Survey: ProgressBar, StepNavigation, VoiceRecorder
- [x] Providers: SurveyProvider with localStorage

## Phase 3: Pages ✅
- [x] Landing page (/)
- [x] Pain-check gate (/survey/pain-check)
- [x] Dynamic steps 1-10 (/survey/step/[step])
- [x] Email opt-in (/survey/email)
- [x] Thank you (/survey/thank-you)

## Phase 4: API Routes ✅
- [x] /api/save - Auto-save to Supabase
- [x] /api/voice/upload - Upload recordings
- [x] /api/transcribe - Whisper API

## Phase 5: Configuration 🔧
- [ ] Add keys to `.env.local` (copy from .env.example)
- [ ] Run SQL schema in Supabase
- [ ] Create voice-recordings storage bucket
- [ ] Test: `npm run dev`
- [ ] Deploy: `vercel`
