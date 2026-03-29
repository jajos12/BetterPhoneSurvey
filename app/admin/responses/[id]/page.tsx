import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AudioPlayer } from '@/components/admin/AudioPlayer';
import ActivityTimeline from '@/components/admin/detail/ActivityTimeline';
import AISummaryCard from '@/components/admin/detail/AISummaryCard';
import { getCondensedIssueLabel, getCondensedPriceLabel } from '@/config/condensed-parent-survey';
import {
  getAdminStepTitle,
  getAdminSurveyViewFromResponse,
  getAdminSurveyViewLabel,
} from '@/lib/admin-survey-utils';
import { supabaseAdmin } from '@/lib/supabase-server';

export const revalidate = 0;

type CondensedParentDetailData = {
  painCheck?: string;
  step1Text?: string;
  issues?: string[];
  ranking?: string[];
  ageRanges?: string[];
  features?: string[];
  featureRanking?: string[];
  objectionText?: string;
  priceWillingness?: string[];
  kidsWithPhones?: string;
  currentDevices?: string[];
  emailOptIn?: boolean;
  screenedOut?: boolean;
  screenedOutReferrals?: string[];
  screenedOutSubmitted?: boolean;
  thankYouReferrals?: string[];
  bonusText?: string;
};

type LongFormParentDetailData = {
  painCheck?: string;
  step1Text?: string;
  step4Text?: string;
  step5Text?: string;
  step6Text?: string;
  step11Text?: string;
  step12Text?: string;
  issues?: string[];
  ranking?: string[];
  benefits?: string[];
  adviceSources?: string[];
  priceWillingness?: string[];
  kidAges?: string;
  kidsWithPhones?: string;
  currentDevice?: string;
  deviceDuration?: string;
  householdIncome?: string;
};

type SchoolAdminDetailData = {
  disruptionFrequency?: string;
  adminRole?: string;
  step1Text?: string;
  step2Text?: string;
  schoolIssues?: string[];
  issueRanking?: string[];
  solutionsTried?: string[];
  solutionEffectiveness?: Record<string, string>;
  step7Text?: string;
  step9Text?: string;
  schoolType?: string;
  gradeLevel?: string;
  enrollment?: string;
  smartphonePercent?: number;
  schoolLocation?: string;
  currentPolicy?: string;
  budgetRange?: string;
  pilotInterest?: string;
  callInterest?: string;
  contactName?: string;
  contactPhone?: string;
  contactPreferredTime?: string;
  step13Text?: string;
  step16Text?: string;
  enforcementSource?: string;
  teacherConsistency?: string;
  teacherSupport?: string;
};

type VoiceRecordingDetail = {
  id: string;
  file_url: string;
  transcript?: string | null;
  step_number: number;
};

function DetailCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="bg-[#0c0c0c] border border-white/5 rounded-3xl p-6 md:p-8">
      <p className="text-[10px] font-black text-white/35 uppercase tracking-[0.3em] mb-3">{eyebrow}</p>
      <h2 className="text-xl font-black text-white tracking-tight mb-5">{title}</h2>
      {children}
    </section>
  );
}

function DetailPills({
  items,
  emptyLabel,
}: {
  items: string[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-white/30 italic">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/70"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function DetailList({
  items,
  emptyLabel,
}: {
  items: string[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-white/30 italic">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={`${item}-${index}`} className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/5 px-4 py-3">
          <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-white/40">
            {index + 1}
          </span>
          <span className="text-sm font-semibold text-white/80">{item}</span>
        </div>
      ))}
    </div>
  );
}

function DetailGrid({
  items,
}: {
  items: Array<{ label: string; value?: string | null }>;
}) {
  const visibleItems = items.filter((item) => item.value);

  if (visibleItems.length === 0) {
    return <p className="text-sm text-white/30 italic">No structured data recorded here yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {visibleItems.map((item) => (
        <div key={item.label} className="rounded-2xl bg-white/5 border border-white/5 p-4">
          <p className="text-[10px] font-black text-white/25 uppercase tracking-[0.2em] mb-2">{item.label}</p>
          <p className="text-sm font-semibold text-white/80">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function QuoteBlock({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  if (!value) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-white/5 border border-white/5 p-4">
      <p className="text-[10px] font-black text-white/25 uppercase tracking-[0.2em] mb-2">{label}</p>
      <p className="text-sm text-white/70 leading-relaxed italic">&ldquo;{value}&rdquo;</p>
    </div>
  );
}

function formatStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.length > 0) : [];
}

function formatMappedList(value: unknown, formatter: (value: string) => string): string[] {
  return formatStringList(value).map(formatter);
}

function renderCondensedParentDetail(formData: CondensedParentDetailData) {
  const issues = formatMappedList(formData.issues, getCondensedIssueLabel);
  const ranking = formatMappedList(formData.ranking, getCondensedIssueLabel);
  const ages = formatStringList(formData.ageRanges);
  const features = formatStringList(formData.features);
  const featureRanking = formatStringList(formData.featureRanking);
  const prices = formatMappedList(formData.priceWillingness, getCondensedPriceLabel);
  const currentDevices = formatStringList(formData.currentDevices);
  const screenedOutReferrals = formatStringList(formData.screenedOutReferrals);
  const thankYouReferrals = formatStringList(formData.thankYouReferrals);
  const isScreenedOut = Boolean(formData.screenedOut);

  if (isScreenedOut) {
    return (
      <div className="space-y-8">
        <DetailCard eyebrow="Screened Out" title="Qualifier Outcome">
          <div className="space-y-4">
            <DetailGrid
              items={[
                { label: 'Qualifier response', value: formData.painCheck || 'No concern' },
                { label: 'Referral submitted', value: formData.screenedOutSubmitted ? 'Yes' : 'No' },
              ]}
            />
            <div>
              <p className="text-[10px] font-black text-white/25 uppercase tracking-[0.2em] mb-3">Referral Contacts</p>
              <DetailPills items={screenedOutReferrals} emptyLabel="No referrals were submitted." />
            </div>
          </div>
        </DetailCard>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DetailCard eyebrow="Condensed" title="Parent Narrative">
        <div className="space-y-4">
          <DetailGrid
            items={[
              { label: 'Qualifier response', value: formData.painCheck },
              { label: 'Kids affected', value: formData.kidsWithPhones },
              { label: 'Age ranges', value: ages.join(', ') || null },
              { label: 'Email opt-in', value: formData.emailOptIn ? 'Yes' : 'No' },
            ]}
          />
          <QuoteBlock label="Core concern and what they tried" value={formData.step1Text} />
        </div>
      </DetailCard>

      <DetailCard eyebrow="Issues" title="Problem Signals">
        <div className="space-y-5">
          <div>
            <p className="text-[10px] font-black text-white/25 uppercase tracking-[0.2em] mb-3">Selected Issues</p>
            <DetailPills items={issues} emptyLabel="No issue selections recorded." />
          </div>
          <div>
            <p className="text-[10px] font-black text-white/25 uppercase tracking-[0.2em] mb-3">Priority Order</p>
            <DetailList items={ranking} emptyLabel="No ranking was needed or recorded." />
          </div>
        </div>
      </DetailCard>

      <DetailCard eyebrow="Feature Fit" title="What They Want Most">
        <div className="space-y-5">
          <div>
            <p className="text-[10px] font-black text-white/25 uppercase tracking-[0.2em] mb-3">Selected Features</p>
            <DetailPills items={features} emptyLabel="No features selected." />
          </div>
          <div>
            <p className="text-[10px] font-black text-white/25 uppercase tracking-[0.2em] mb-3">Feature Ranking</p>
            <DetailList items={featureRanking} emptyLabel="No feature ranking recorded." />
          </div>
        </div>
      </DetailCard>

      <DetailCard eyebrow="Switching" title="Barriers, Bonus, and Referrals">
        <div className="space-y-5">
          <DetailGrid
            items={[
              { label: 'Current devices', value: currentDevices.join(', ') || null },
            ]}
          />
          <QuoteBlock label="What would still stop them from switching" value={formData.objectionText} />
          <QuoteBlock label="Bonus detail" value={formData.bonusText} />
          <div>
            <p className="text-[10px] font-black text-white/25 uppercase tracking-[0.2em] mb-3">Max Price Willingness</p>
            <DetailPills items={prices} emptyLabel="No price range recorded." />
          </div>
          <div>
            <p className="text-[10px] font-black text-white/25 uppercase tracking-[0.2em] mb-3">Thank-You Referrals</p>
            <DetailPills items={thankYouReferrals} emptyLabel="No thank-you referrals recorded." />
          </div>
        </div>
      </DetailCard>
    </div>
  );
}

function renderLongFormParentDetail(formData: LongFormParentDetailData) {
  const issues = formatStringList(formData.issues);
  const ranking = formatStringList(formData.ranking);
  const benefits = formatStringList(formData.benefits);
  const adviceSources = formatStringList(formData.adviceSources);
  const prices = formatStringList(formData.priceWillingness);

  return (
    <div className="space-y-8">
      <DetailCard eyebrow="Legacy Parent" title="Emotional Intake">
        <div className="space-y-4">
          <DetailGrid items={[{ label: 'Pain Check', value: formData.painCheck }]} />
          <QuoteBlock label="Initial brain dump" value={formData.step1Text} />
          <QuoteBlock label="Urgency and impact" value={formData.step4Text} />
        </div>
      </DetailCard>

      <DetailCard eyebrow="Pain Points" title="Issues and Desired Outcomes">
        <div className="space-y-5">
          <div>
            <p className="text-[10px] font-black text-white/25 uppercase tracking-[0.2em] mb-3">Selected Issues</p>
            <DetailPills items={issues} emptyLabel="No issues selected." />
          </div>
          <div>
            <p className="text-[10px] font-black text-white/25 uppercase tracking-[0.2em] mb-3">Ranked Order</p>
            <DetailList items={ranking} emptyLabel="No ranking recorded." />
          </div>
          <div>
            <p className="text-[10px] font-black text-white/25 uppercase tracking-[0.2em] mb-3">Desired Benefits</p>
            <DetailPills items={benefits} emptyLabel="No benefit selections recorded." />
          </div>
        </div>
      </DetailCard>

      <DetailCard eyebrow="Context" title="What They Tried and Family Snapshot">
        <div className="space-y-5">
          <QuoteBlock label="Previous efforts" value={formData.step5Text} />
          <QuoteBlock label="Switching concerns" value={formData.step6Text} />
          <DetailGrid
            items={[
              { label: 'Kid ages', value: formData.kidAges },
              { label: 'Kids with phones', value: formData.kidsWithPhones },
              { label: 'Current device', value: formData.currentDevice },
              { label: 'Device duration', value: formData.deviceDuration },
              { label: 'Household income', value: formData.householdIncome },
            ]}
          />
          <div>
            <p className="text-[10px] font-black text-white/25 uppercase tracking-[0.2em] mb-3">Advice Sources</p>
            <DetailPills items={adviceSources} emptyLabel="No advice sources recorded." />
          </div>
          <div>
            <p className="text-[10px] font-black text-white/25 uppercase tracking-[0.2em] mb-3">Price Willingness</p>
            <DetailPills items={prices} emptyLabel="No price ranges selected." />
          </div>
        </div>
      </DetailCard>

      <DetailCard eyebrow="Closing Notes" title="Final Thoughts">
        <div className="space-y-4">
          <QuoteBlock label="Why they clicked" value={formData.step11Text} />
          <QuoteBlock label="Anything else" value={formData.step12Text} />
        </div>
      </DetailCard>
    </div>
  );
}

function renderSchoolAdminDetail(formData: SchoolAdminDetailData) {
  const issues = formatStringList(formData.schoolIssues);
  const ranking = formatStringList(formData.issueRanking);
  const solutions = formatStringList(formData.solutionsTried);
  const effectivenessEntries = Object.entries(formData.solutionEffectiveness || {}).map(
    ([solution, effectiveness]) => `${solution}: ${String(effectiveness)}`
  );

  return (
    <div className="space-y-8">
      <DetailCard eyebrow="School Admin" title="Disruption Snapshot">
        <div className="space-y-4">
          <DetailGrid
            items={[
              { label: 'Disruption frequency', value: formData.disruptionFrequency },
              { label: 'Role', value: formData.adminRole },
            ]}
          />
          <QuoteBlock label="What caught their attention" value={formData.step1Text} />
          <QuoteBlock label="Biggest challenge" value={formData.step2Text} />
        </div>
      </DetailCard>

      <DetailCard eyebrow="Priorities" title="Issues and Enforcement">
        <div className="space-y-5">
          <div>
            <p className="text-[10px] font-black text-white/25 uppercase tracking-[0.2em] mb-3">School Issues</p>
            <DetailPills items={issues} emptyLabel="No school issues selected." />
          </div>
          <div>
            <p className="text-[10px] font-black text-white/25 uppercase tracking-[0.2em] mb-3">Issue Ranking</p>
            <DetailList items={ranking} emptyLabel="No ranking recorded." />
          </div>
          <DetailGrid
            items={[
              { label: 'Enforcement source', value: formData.enforcementSource },
              { label: 'Teacher consistency', value: formData.teacherConsistency },
              { label: 'Teacher support', value: formData.teacherSupport },
            ]}
          />
        </div>
      </DetailCard>

      <DetailCard eyebrow="Solutions" title="Attempts, Barriers, and Ideal State">
        <div className="space-y-5">
          <div>
            <p className="text-[10px] font-black text-white/25 uppercase tracking-[0.2em] mb-3">Solutions Tried</p>
            <DetailPills items={solutions} emptyLabel="No attempted solutions recorded." />
          </div>
          <div>
            <p className="text-[10px] font-black text-white/25 uppercase tracking-[0.2em] mb-3">Effectiveness Ratings</p>
            <DetailPills items={effectivenessEntries} emptyLabel="No effectiveness ratings recorded." />
          </div>
          <QuoteBlock label="Implementation barriers" value={formData.step7Text} />
          <QuoteBlock label="Ideal solution" value={formData.step9Text} />
        </div>
      </DetailCard>

      <DetailCard eyebrow="Profile" title="School Profile and Decision Path">
        <div className="space-y-5">
          <DetailGrid
            items={[
              { label: 'School type', value: formData.schoolType },
              { label: 'Grade level', value: formData.gradeLevel },
              { label: 'Enrollment', value: formData.enrollment },
              { label: 'Phone ownership %', value: formData.smartphonePercent ? `${formData.smartphonePercent}%` : null },
              { label: 'School location', value: formData.schoolLocation },
              { label: 'Current policy', value: formData.currentPolicy },
              { label: 'Budget range', value: formData.budgetRange },
              { label: 'Pilot interest', value: formData.pilotInterest },
              { label: 'Call interest', value: formData.callInterest },
              { label: 'Contact name', value: formData.contactName },
              { label: 'Contact phone', value: formData.contactPhone },
              { label: 'Preferred time', value: formData.contactPreferredTime },
            ]}
          />
          <QuoteBlock label="Decision process" value={formData.step13Text} />
          <QuoteBlock label="Anything else" value={formData.step16Text} />
        </div>
      </DetailCard>
    </div>
  );
}

async function getResponse(sessionId: string) {
  try {
    const { data: response, error: responseError } = await supabaseAdmin
      .from('survey_responses')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (responseError) {
      throw responseError;
    }

    const { data: recordings, error: recordingsError } = await supabaseAdmin
      .from('voice_recordings')
      .select('*')
      .eq('session_id', sessionId)
      .order('step_number');

    if (recordingsError) {
      throw recordingsError;
    }

    const recordingsWithSignedUrls = await Promise.all(
      (recordings || []).map(async (recording) => {
        try {
          let path = recording.file_url;
          if (path.includes('/public/voice-recordings/')) {
            path = path.split('/public/voice-recordings/').pop() || path;
          } else if (path.includes('voice-recordings/')) {
            path = path.split('voice-recordings/').pop() || path;
          }

          const { data: signedData, error: signedError } = await supabaseAdmin.storage
            .from('voice-recordings')
            .createSignedUrl(path, 3600);

          if (signedError) {
            console.warn(`Failed to sign URL for ${path}:`, signedError);
            return recording;
          }

          return {
            ...recording,
            file_url: signedData.signedUrl,
          };
        } catch (error) {
          console.error('Signing error:', error);
          return recording;
        }
      })
    );

    const [notesResult, tagAssignmentsResult] = await Promise.all([
      supabaseAdmin
        .from('admin_notes')
        .select('created_at')
        .eq('response_id', response.id)
        .order('created_at'),
      supabaseAdmin
        .from('response_tag_assignments')
        .select('assigned_at')
        .eq('response_id', response.id)
        .order('assigned_at'),
    ]);

    const timelineEvents: Array<{ type: string; timestamp: string; details: string }> = [
      {
        type: 'started',
        timestamp: response.started_at,
        details: 'Survey started',
      },
    ];

    for (const recording of recordings || []) {
      timelineEvents.push({
        type: 'voice_recorded',
        timestamp: recording.created_at,
        details: `Voice recorded at Step ${recording.step_number}`,
      });
    }

    if (response.completed_at) {
      timelineEvents.push({
        type: 'completed',
        timestamp: response.completed_at,
        details: 'Survey completed',
      });
    }

    if (response.ai_summary_generated_at) {
      timelineEvents.push({
        type: 'ai_analyzed',
        timestamp: response.ai_summary_generated_at,
        details: 'AI analysis generated',
      });
    }

    for (const note of notesResult.data || []) {
      timelineEvents.push({
        type: 'note_added',
        timestamp: note.created_at,
        details: 'Admin note added',
      });
    }

    for (const tag of tagAssignmentsResult.data || []) {
      timelineEvents.push({
        type: 'tag_added',
        timestamp: tag.assigned_at,
        details: 'Tag assigned',
      });
    }

    timelineEvents.sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime());

    return {
      response,
      recordings: recordingsWithSignedUrls,
      timelineEvents,
    };
  } catch (error) {
    console.error('Failed to fetch response:', error);
    return null;
  }
}

export default async function ResponseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getResponse(id);

  if (!data || !data.response) {
    notFound();
  }

  const { response, recordings, timelineEvents } = data;
  const formData = response.form_data || {};
  const surveyView = getAdminSurveyViewFromResponse(response);
  const surveyLabel = getAdminSurveyViewLabel(surveyView);
  const isOptedIn = Boolean(response.email_opt_in ?? formData.emailOptIn);
  const isCompleted = Boolean(response.is_completed || formData.isCompleted);
  const displayEmail = response.email || formData.email || 'Anonymous Collector';

  const detailContent =
    surveyView === 'parent_condensed'
      ? renderCondensedParentDetail(formData)
      : surveyView === 'parent_long'
      ? renderLongFormParentDetail(formData)
      : renderSchoolAdminDetail(formData);

  return (
    <div className="space-y-10 selection:bg-white/10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Link
            href="/admin/responses"
            className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.2em] mb-4 group"
          >
            <svg className="w-3 h-3 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Return to Intelligence
          </Link>
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 ${
                isCompleted
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                  : 'bg-orange-500/10 border-orange-500 text-orange-400'
              }`}
            >
              <span className="text-2xl font-black">{displayEmail.charAt(0).toUpperCase() || '?'}</span>
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-black text-white tracking-tighter uppercase">{displayEmail}</h1>
                <span className="px-3 py-1 rounded-lg border border-white/10 bg-white/5 text-[10px] font-black tracking-[0.2em] uppercase text-white/65">
                  {surveyLabel}
                </span>
              </div>
              <p className="text-xs font-mono text-white/40 mt-1 uppercase tracking-widest italic">
                REF_ID: {response.session_id}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div
            className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase border ${
              isCompleted
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
            }`}
          >
            {isCompleted ? 'INTAKE_COMPLETE' : 'INTAKE_ONGOING'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">{detailContent}</div>

        <div className="space-y-8">
          <AISummaryCard sessionId={response.session_id} initialSummary={response.ai_summary || null} />

          <div className="bg-[#0c0c0c] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-600/10 blur-[60px] rounded-full group-hover:bg-purple-600/20 transition-all" />

            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-black text-white uppercase tracking-widest">Voice Record</h3>
              <span className="text-[10px] font-mono text-white/40 whitespace-nowrap italic uppercase">RAW_AUDIO_STREAM</span>
            </div>

            {recordings.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">No voice data intercepted</p>
              </div>
            ) : (
              <div className="space-y-6 relative z-10">
                {recordings.map((recording: VoiceRecordingDetail) => {
                  const stepLabel = getAdminStepTitle(surveyView, String(recording.step_number));

                  return (
                    <div key={recording.id} className="space-y-4">
                      <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                        {stepLabel}
                      </p>
                      <AudioPlayer src={recording.file_url} />

                      {recording.transcript && (
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 italic">
                            Intelligence Transcript
                          </p>
                          <p className="text-xs text-white/60 leading-relaxed italic">&ldquo;{recording.transcript}&rdquo;</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Marketing Opt-in</h3>
              <div
                className={`w-3 h-3 rounded-full ${
                  isOptedIn ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500'
                }`}
              />
            </div>
            <p className="mt-2 text-xl font-bold text-white uppercase">{isOptedIn ? 'Authorized' : 'Denied'}</p>
          </div>

          {timelineEvents && timelineEvents.length > 0 && <ActivityTimeline events={timelineEvents} />}
        </div>
      </div>
    </div>
  );
}
