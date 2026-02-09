'use client';

import type { ComparisonData } from '@/types/admin';

interface ComparisonGridProps {
  responses: ComparisonData[];
}

const COLUMN_COLORS = ['blue', 'purple', 'emerald'] as const;

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="col-span-full py-3 border-b border-white/5">
      <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{title}</span>
    </div>
  );
}

function findShared(arrays: string[][]): Set<string> {
  if (arrays.length < 2) return new Set();
  const first = new Set(arrays[0]);
  return new Set([...first].filter(item => arrays.every(arr => arr.includes(item))));
}

export default function ComparisonGrid({ responses }: ComparisonGridProps) {
  const cols = responses.length;
  const gridCols = cols === 2 ? 'grid-cols-2' : 'grid-cols-3';

  const sharedIssues = findShared(responses.map(r => r.issues));
  const sharedBenefits = findShared(responses.map(r => r.benefits));

  return (
    <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl overflow-hidden">
      {/* Column Headers */}
      <div className={`grid ${gridCols} border-b border-white/5`}>
        {responses.map((r, i) => {
          const color = COLUMN_COLORS[i];
          return (
            <div key={r.sessionId} className={`p-5 ${i > 0 ? 'border-l border-white/5' : ''}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${
                  color === 'blue' ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' :
                  color === 'purple' ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400' :
                  'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                }`}>
                  {r.email[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-white truncate max-w-[180px]">{r.email}</p>
                  <p className="text-[9px] text-white/30 font-mono">{r.sessionId.slice(0, 12)}...</p>
                </div>
              </div>
              <div className="mt-2">
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  r.isCompleted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'
                }`}>
                  {r.isCompleted ? 'Complete' : 'Ongoing'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`grid ${gridCols}`}>
        {/* Pain Check */}
        <SectionHeader title="Pain Check" />
        {responses.map((r, i) => (
          <div key={`pain-${r.sessionId}`} className={`p-5 ${i > 0 ? 'border-l border-white/5' : ''}`}>
            <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${
              r.painCheck === 'crisis' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
              r.painCheck === 'yes' ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400' :
              r.painCheck === 'sometimes' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' :
              'bg-white/5 border border-white/10 text-white/40'
            }`}>
              {r.painCheck || 'N/A'}
            </span>
          </div>
        ))}

        {/* Issues */}
        <SectionHeader title="Friction Points" />
        {responses.map((r, i) => (
          <div key={`issues-${r.sessionId}`} className={`p-5 space-y-1.5 ${i > 0 ? 'border-l border-white/5' : ''}`}>
            {r.issues.length > 0 ? r.issues.map((issue, idx) => {
              const isShared = sharedIssues.has(issue);
              return (
                <div key={idx} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium ${
                  isShared
                    ? 'bg-emerald-500/10 border border-emerald-500/15 text-emerald-400'
                    : 'bg-amber-500/5 border border-amber-500/10 text-amber-400/70'
                }`}>
                  <span className="text-[9px] text-white/30 font-mono">{idx + 1}</span>
                  <span className="truncate">{issue}</span>
                </div>
              );
            }) : (
              <span className="text-xs text-white/20 italic">No issues selected</span>
            )}
          </div>
        ))}

        {/* Benefits */}
        <SectionHeader title="Desired Benefits" />
        {responses.map((r, i) => (
          <div key={`benefits-${r.sessionId}`} className={`p-5 ${i > 0 ? 'border-l border-white/5' : ''}`}>
            <div className="flex flex-wrap gap-1.5">
              {r.benefits.length > 0 ? r.benefits.map((benefit, idx) => {
                const isShared = sharedBenefits.has(benefit);
                return (
                  <span key={idx} className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                    isShared
                      ? 'bg-emerald-500/10 border border-emerald-500/15 text-emerald-400'
                      : 'bg-amber-500/5 border border-amber-500/10 text-amber-400/70'
                  }`}>
                    {benefit}
                  </span>
                );
              }) : (
                <span className="text-xs text-white/20 italic">No benefits selected</span>
              )}
            </div>
          </div>
        ))}

        {/* AI Summary Scores */}
        <SectionHeader title="AI Analysis" />
        {responses.map((r, i) => {
          const ai = r.aiSummary;
          return (
            <div key={`ai-${r.sessionId}`} className={`p-5 space-y-3 ${i > 0 ? 'border-l border-white/5' : ''}`}>
              {ai ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[9px] font-black text-white/20 uppercase mb-1">Urgency</p>
                      <p className={`text-lg font-black ${
                        (ai.urgencyScore || 0) >= 7 ? 'text-red-400' :
                        (ai.urgencyScore || 0) >= 4 ? 'text-orange-400' : 'text-emerald-400'
                      }`}>
                        {ai.urgencyScore || '—'}/10
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-white/20 uppercase mb-1">Product Fit</p>
                      <p className={`text-lg font-black ${
                        (ai.productFitScore || 0) >= 7 ? 'text-emerald-400' :
                        (ai.productFitScore || 0) >= 4 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {ai.productFitScore || '—'}/10
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-white/20 uppercase mb-1">Tone</p>
                    <span className="text-xs font-bold text-white/60 capitalize">{ai.emotionalTone || '—'}</span>
                  </div>
                  {ai.primaryConcerns && ai.primaryConcerns.length > 0 && (
                    <div>
                      <p className="text-[9px] font-black text-white/20 uppercase mb-1">Key Concerns</p>
                      <div className="space-y-1">
                        {ai.primaryConcerns.slice(0, 3).map((c, ci) => (
                          <p key={ci} className="text-[11px] text-white/40 leading-snug">{c}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-white/20 italic">No AI analysis yet</p>
              )}
            </div>
          );
        })}

        {/* Demographics */}
        <SectionHeader title="Demographics" />
        {responses.map((r, i) => {
          const fd = r.formData as Record<string, any>;
          return (
            <div key={`demo-${r.sessionId}`} className={`p-5 space-y-3 ${i > 0 ? 'border-l border-white/5' : ''}`}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] font-black text-white/20 uppercase mb-1">Kid Ages</p>
                  <p className="text-xs font-bold text-white/60">{fd?.kidAges || '—'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-white/20 uppercase mb-1">Kids w/ Phones</p>
                  <p className="text-xs font-bold text-white/60">{fd?.kidsWithPhones || '—'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-white/20 uppercase mb-1">Device</p>
                  <p className="text-xs font-bold text-white/60">{fd?.currentDevice || '—'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-white/20 uppercase mb-1">Duration</p>
                  <p className="text-xs font-bold text-white/60">{fd?.deviceDuration || '—'}</p>
                </div>
              </div>
              {fd?.priceWillingness && (
                <div>
                  <p className="text-[9px] font-black text-white/20 uppercase mb-1">Price Range</p>
                  <div className="flex flex-wrap gap-1">
                    {(fd.priceWillingness as string[]).map((p, pi) => (
                      <span key={pi} className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/5 rounded-md text-white/50 font-medium">{p}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Voice Transcripts */}
        <SectionHeader title="Voice Transcripts" />
        {responses.map((r, i) => (
          <div key={`transcripts-${r.sessionId}`} className={`p-5 space-y-3 ${i > 0 ? 'border-l border-white/5' : ''}`}>
            {r.transcripts.length > 0 ? r.transcripts.map((t, ti) => (
              <div key={ti} className="space-y-1">
                <p className="text-[9px] font-black text-purple-400/60 uppercase tracking-wider">Step {t.stepNumber}</p>
                <p className="text-[11px] text-white/40 leading-relaxed italic line-clamp-4">&ldquo;{t.transcript}&rdquo;</p>
              </div>
            )) : (
              <span className="text-xs text-white/20 italic">No voice data</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
