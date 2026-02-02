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
        <div>
            <Link href="/admin/responses" className="text-primary hover:underline text-sm mb-4 inline-block">
                ← Back to responses
            </Link>

            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-2xl font-bold mb-2">
                        {response.email || 'Anonymous Response'}
                    </h1>
                    <p className="text-text-muted text-sm">
                        Session: {response.session_id}
                    </p>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${response.is_completed
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                    {response.is_completed ? 'Complete' : 'Partial'}
                </span>
            </div>

            {/* Form Data */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="font-semibold mb-4">Survey Responses</h2>

                <div className="space-y-4">
                    {formData.painCheck && (
                        <div>
                            <p className="text-sm text-text-muted">Pain Check</p>
                            <p className="font-medium">{formData.painCheck}</p>
                        </div>
                    )}

                    {formData.issues?.length > 0 && (
                        <div>
                            <p className="text-sm text-text-muted">Issues</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {formData.issues.map((issue: string) => (
                                    <span key={issue} className="px-2 py-1 bg-gray-100 rounded text-sm">
                                        {issue}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {formData.benefits?.length > 0 && (
                        <div>
                            <p className="text-sm text-text-muted">Desired Benefits</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {formData.benefits.map((benefit: string) => (
                                    <span key={benefit} className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                                        {benefit}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {formData.kidAges && (
                        <div>
                            <p className="text-sm text-text-muted">Children's Ages</p>
                            <p className="font-medium">{formData.kidAges}</p>
                        </div>
                    )}

                    {formData.currentDevice && (
                        <div>
                            <p className="text-sm text-text-muted">Current Device</p>
                            <p className="font-medium">{formData.currentDevice}</p>
                        </div>
                    )}

                    {formData.clickMotivation && (
                        <div>
                            <p className="text-sm text-text-muted">Why They Clicked</p>
                            <p className="font-medium">{formData.clickMotivation}</p>
                        </div>
                    )}

                    {formData.anythingElse && (
                        <div>
                            <p className="text-sm text-text-muted">Additional Comments</p>
                            <p className="font-medium">{formData.anythingElse}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Voice Recordings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-semibold mb-4">Voice Recordings ({recordings.length})</h2>

                {recordings.length === 0 ? (
                    <p className="text-text-muted text-sm">No voice recordings</p>
                ) : (
                    <div className="space-y-4">
                        {recordings.map((recording: any) => (
                            <div key={recording.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="font-medium">Step {recording.step_number}</p>
                                        <p className="text-xs text-text-muted">
                                            {new Date(recording.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-xs ${recording.processing_status === 'completed'
                                            ? 'bg-green-100 text-green-700'
                                            : recording.processing_status === 'processing'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {recording.processing_status}
                                    </span>
                                </div>

                                {recording.file_url && (
                                    <audio
                                        src={recording.file_url}
                                        controls
                                        className="w-full mb-3"
                                    />
                                )}

                                {recording.transcript && (
                                    <div className="bg-gray-50 rounded p-3 mb-3">
                                        <p className="text-xs text-text-muted mb-1">Transcript</p>
                                        <p className="text-sm">{recording.transcript}</p>
                                    </div>
                                )}

                                {recording.extracted_data && (
                                    <div className="bg-primary/5 rounded p-3">
                                        <p className="text-xs text-primary mb-1">AI Extraction</p>
                                        <pre className="text-sm overflow-auto">
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
