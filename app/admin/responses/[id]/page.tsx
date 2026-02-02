import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-server';

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

        return {
            response,
            recordings: recordings || [],
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

    return (
        <div className="max-w-4xl">
            {/* Back link */}
            <Link
                href="/admin/responses"
                className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm mb-6"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to responses
            </Link>

            {/* Header */}
            <div className="bg-[#16161d] border border-white/10 rounded-xl p-6 mb-5">
                <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${response.is_completed
                                ? 'bg-green-500/20'
                                : 'bg-orange-500/20'
                            }`}>
                            <span className={`text-xl font-bold ${response.is_completed ? 'text-green-400' : 'text-orange-400'
                                }`}>
                                {response.email ? response.email[0].toUpperCase() : '?'}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">
                                {response.email || 'Anonymous'}
                            </h1>
                            <p className="text-xs text-white/30 font-mono mt-1">{response.session_id}</p>
                        </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${response.is_completed
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-orange-500/20 text-orange-400'
                        }`}>
                        {response.is_completed ? 'Complete' : 'In Progress'}
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                        <p className="text-white/40 text-xs mb-1">Started</p>
                        <p className="text-white/80">
                            {new Date(response.started_at).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            })}
                        </p>
                    </div>
                    <div>
                        <p className="text-white/40 text-xs mb-1">Current Step</p>
                        <p className="text-white/80">{response.current_step || '—'}</p>
                    </div>
                    <div>
                        <p className="text-white/40 text-xs mb-1">Email Opt-in</p>
                        <p className="text-white/80">{response.email_opt_in ? 'Yes' : 'No'}</p>
                    </div>
                </div>
            </div>

            {/* Survey Responses */}
            <div className="bg-[#16161d] border border-white/10 rounded-xl mb-5">
                <div className="p-5 border-b border-white/10">
                    <h2 className="font-semibold text-white">Survey Responses</h2>
                </div>
                <div className="p-5 space-y-5">
                    {formData.painCheck && (
                        <div>
                            <p className="text-xs text-white/40 mb-1">Pain Check</p>
                            <p className="text-white/80">{formData.painCheck}</p>
                        </div>
                    )}

                    {formData.issues?.length > 0 && (
                        <div>
                            <p className="text-xs text-white/40 mb-2">Issues</p>
                            <div className="flex flex-wrap gap-2">
                                {formData.issues.map((issue: string) => (
                                    <span key={issue} className="px-2.5 py-1 bg-white/10 rounded text-sm text-white/70">
                                        {issue}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {formData.benefits?.length > 0 && (
                        <div>
                            <p className="text-xs text-white/40 mb-2">Desired Benefits</p>
                            <div className="flex flex-wrap gap-2">
                                {formData.benefits.map((benefit: string) => (
                                    <span key={benefit} className="px-2.5 py-1 bg-blue-500/20 rounded text-sm text-blue-400">
                                        {benefit}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {formData.kidAges && (
                        <div>
                            <p className="text-xs text-white/40 mb-1">Children&apos;s Ages</p>
                            <p className="text-white/80">{formData.kidAges}</p>
                        </div>
                    )}

                    {formData.currentDevice && (
                        <div>
                            <p className="text-xs text-white/40 mb-1">Current Device</p>
                            <p className="text-white/80">{formData.currentDevice}</p>
                        </div>
                    )}

                    {Object.keys(formData).length === 0 && (
                        <p className="text-white/40 text-center py-4">No form data yet</p>
                    )}
                </div>
            </div>

            {/* Voice Recordings */}
            <div className="bg-[#16161d] border border-white/10 rounded-xl">
                <div className="p-5 border-b border-white/10">
                    <h2 className="font-semibold text-white">
                        Voice Recordings ({recordings.length})
                    </h2>
                </div>

                {recordings.length === 0 ? (
                    <div className="p-10 text-center">
                        <p className="text-white/40">No recordings</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {recordings.map((recording: any) => (
                            <div key={recording.id} className="p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                            <span className="text-purple-400 font-medium text-sm">{recording.step_number}</span>
                                        </div>
                                        <div>
                                            <p className="text-white font-medium text-sm">Step {recording.step_number}</p>
                                            <p className="text-xs text-white/30">
                                                {new Date(recording.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs ${recording.processing_status === 'completed'
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-white/10 text-white/40'
                                        }`}>
                                        {recording.processing_status}
                                    </span>
                                </div>

                                {recording.file_url && (
                                    <audio
                                        src={recording.file_url}
                                        controls
                                        className="w-full h-10 mb-4"
                                    />
                                )}

                                {recording.transcript && (
                                    <div className="bg-white/5 rounded-lg p-4 mb-4">
                                        <p className="text-xs text-white/40 mb-2">Transcript</p>
                                        <p className="text-white/80 text-sm">{recording.transcript}</p>
                                    </div>
                                )}

                                {recording.extracted_data && (
                                    <div className="bg-blue-500/10 rounded-lg p-4">
                                        <p className="text-xs text-blue-400 mb-2">AI Extraction</p>
                                        <pre className="text-sm text-white/70 overflow-auto">
                                            {JSON.stringify(recording.extracted_data, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
