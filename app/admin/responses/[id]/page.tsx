import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-server';
import { AudioPlayer } from '@/components/admin/AudioPlayer';

export const revalidate = 0;

async function getResponse(sessionId: string) {
    try {
        const { data: response, error: responseError } = await supabaseAdmin
            .from('survey_responses')
            .select('*')
            .eq('session_id', sessionId)
            .single();

        if (responseError) throw responseError;

        const { data: recordings, error: recordingsError } = await supabaseAdmin
            .from('voice_recordings')
            .select('*')
            .eq('session_id', sessionId)
            .order('step_number');

        if (recordingsError) throw recordingsError;

        // Generate signed URLs for recordings if they exist
        const recordingsWithSignedUrls = await Promise.all((recordings || []).map(async (rec) => {
            try {
                // Determine path from URL if needed, but normally file_url stores the path or full URL
                // We'll extract the path if it looks like a public URL, otherwise use as is
                let path = rec.file_url;
                if (path.includes('/public/voice-recordings/')) {
                    path = path.split('/public/voice-recordings/').pop() || path;
                } else if (path.includes('voice-recordings/')) {
                    path = path.split('voice-recordings/').pop() || path;
                }

                const { data: signedData, error: signedError } = await supabaseAdmin.storage
                    .from('voice-recordings')
                    .createSignedUrl(path, 3600); // 1 hour

                if (signedError) {
                    console.warn(`Failed to sign URL for ${path}:`, signedError);
                    return rec; // Fallback to public URL
                }

                return {
                    ...rec,
                    file_url: signedData.signedUrl
                };
            } catch (err) {
                console.error("Signing error:", err);
                return rec;
            }
        }));

        return {
            response,
            recordings: recordingsWithSignedUrls,
        };
    } catch (error) {
        console.error('Failed to fetch response:', error);
        return null;
    }
}

export default async function ResponseDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;
    const data = await getResponse(id);

    if (!data || !data.response) {
        notFound();
    }

    const { response, recordings } = data;
    const formData = response.form_data || {};

    // Ensure we capture critical data from both column and JSON
    const isOptedIn = response.email_opt_in || formData.emailOptIn;
    const isCompleted = response.is_completed || formData.isCompleted;
    const displayEmail = response.email || formData.email || 'Anonymous Collector';

    return (
        <div className="space-y-10 selection:bg-white/10">
            {/* Header & Meta */}
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
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 ${isCompleted ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-orange-500/10 border-orange-500 text-orange-400'
                            }`}>
                            <span className="text-2xl font-black">{displayEmail[0].toUpperCase()}</span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">{displayEmail}</h1>
                            <p className="text-xs font-mono text-white/40 mt-1 uppercase tracking-widest italic">REF_ID: {response.session_id}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase border ${isCompleted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                        }`}>
                        {isCompleted ? 'INTAKE_COMPLETE' : 'INTAKE_ONGOING'}
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visual Data Dossier */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Survey Breakdown */}
                    <div className="bg-[#0c0c0c] border border-white/5 rounded-3xl p-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                        <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.3em] mb-10">Intake Progress List</h3>

                        <div className="space-y-12 relative">
                            {/* Vertical Line */}
                            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-white/5" />

                            {/* S01: Emotional Context */}
                            {(formData.painCheck || formData.step1Text) && (
                                <div className="relative pl-12">
                                    <div className="absolute left-0 top-1 w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">S01 // EMOTIONAL_INTAKE</p>
                                    <p className="text-lg font-bold text-white uppercase mb-2">Pain Check: {formData.painCheck}</p>
                                    {formData.step1Text && (
                                        <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                                            <p className="text-xs text-white/60 leading-relaxed italic">&quot;{formData.step1Text}&quot;</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Issues Ranking */}
                            {formData.issues?.length > 0 && (
                                <div className="relative pl-12">
                                    <div className="absolute left-0 top-1 w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(167,139,250,0.2)]">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                    </div>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">S03 // ORDERED_FRICTION_POINTS</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {formData.issues.map((issue: string, i: number) => (
                                            <div key={issue} className="flex items-center gap-4 bg-white/5 border border-white/5 p-3 rounded-xl group transition-all hover:bg-white/10 hover:border-white/10">
                                                <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-white/40">{i + 1}</span>
                                                <span className="text-sm font-bold text-white/80">{issue}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* S04: Benefits & Missing Time */}
                            {(formData.benefits?.length > 0 || formData.step4Text) && (
                                <div className="relative pl-12">
                                    <div className="absolute left-0 top-1 w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">S04 // DESIRED_OUTCOMES</p>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {formData.benefits?.map((benefit: string) => (
                                            <span key={benefit} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-bold text-emerald-400">
                                                {benefit}
                                            </span>
                                        ))}
                                    </div>
                                    {formData.step4Text && (
                                        <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                                            <p className="text-xs text-white/40 uppercase font-black tracking-widest mb-1">Sentiment: Nostalgia/Missed Time</p>
                                            <p className="text-xs text-white/60 leading-relaxed italic">&quot;{formData.step4Text}&quot;</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* S05 & S06: Efforts & Obstacles */}
                            {(formData.step5Text || formData.step6Text) && (
                                <div className="relative pl-12">
                                    <div className="absolute left-0 top-1 w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">S05-06 // EFFORTS_AND_OBSTACLES</p>
                                    <div className="space-y-4">
                                        {formData.step5Text && (
                                            <div>
                                                <p className="text-[9px] font-black text-white/20 uppercase mb-1">Previous Efforts</p>
                                                <p className="text-sm text-white/80">{formData.step5Text}</p>
                                            </div>
                                        )}
                                        {formData.step6Text && (
                                            <div>
                                                <p className="text-[9px] font-black text-white/20 uppercase mb-1">Logistical Hurdles</p>
                                                <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-lg">
                                                    <p className="text-sm text-white/80">{formData.step6Text}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* S09-10: Final Context */}
                            {(formData.step9Text || formData.step10Text) && (
                                <div className="relative pl-12">
                                    <div className="absolute left-0 top-1 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">S09-10 // FINAL_THOUGHTS</p>
                                    <div className="space-y-4">
                                        {formData.step9Text && (
                                            <div>
                                                <p className="text-[9px] font-black text-white/20 uppercase mb-1">Incentive Source</p>
                                                <p className="text-sm text-white/80">{formData.step9Text}</p>
                                            </div>
                                        )}
                                        {formData.step10Text && (
                                            <div>
                                                <p className="text-[9px] font-black text-white/20 uppercase mb-1">Closing Sentiment</p>
                                                <p className="text-sm text-white/80 italic">&quot;{formData.step10Text}&quot;</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Market Data */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative pl-12">
                                <div className="absolute left-0 top-1 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Children Data</p>
                                        <p className="text-lg font-bold text-white uppercase">{formData.kidAges || 'NOT_SPECIFIED'}</p>
                                        <p className="text-[10px] text-white/20 font-mono mt-1 uppercase">Count: {formData.kidsWithPhones || '?'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Device Affinity</p>
                                        <p className="text-lg font-bold text-white uppercase">{formData.currentDevice || 'NOT_SPECIFIED'}</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Usage Duration</p>
                                        <p className="text-sm font-medium text-white/60 leading-relaxed capitalize">{formData.deviceDuration || 'NONE_RECORDED'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Voice Intelligence Sidebar */}
                <div className="space-y-8">
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
                                {recordings.map((rec: any) => (
                                    <div key={rec.id} className="space-y-4">
                                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                                            Step {rec.step_number} Record
                                        </p>
                                        <AudioPlayer src={rec.file_url} />

                                        {rec.transcript && (
                                            <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 italic">Intelligence Transcript</p>
                                                <p className="text-xs text-white/60 leading-relaxed italic">&quot;{rec.transcript}&quot;</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Email Opt-in */}
                    <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Marketing Opt-in</h3>
                            <div className={`w-3 h-3 rounded-full ${isOptedIn ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                        </div>
                        <p className="mt-2 text-xl font-bold text-white uppercase">{isOptedIn ? 'Authorized' : 'Denied'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
