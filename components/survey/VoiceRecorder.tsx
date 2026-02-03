'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { formatDuration } from '@/lib/utils';
import { useSurvey } from '@/components/providers/SurveyProvider';

interface VoiceRecorderProps {
    sessionId: string;
    stepNumber: number;
    onRecordingComplete?: (blob: Blob, duration: number) => void;
    onUploadComplete?: (url: string, recordingId: string) => void;
}

type RecordingState = 'idle' | 'recording' | 'recorded' | 'uploading' | 'transcribing' | 'error';

export function VoiceRecorder({
    sessionId,
    stepNumber,
    onRecordingComplete,
    onUploadComplete
}: VoiceRecorderProps) {
    const { updateFormData } = useSurvey();
    const [state, setState] = useState<RecordingState>('idle');
    const [duration, setDuration] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [uploadStatus, setUploadStatus] = useState<string>('');
    const [transcription, setTranscription] = useState<string | null>(null);
    const [isEditingTranscript, setIsEditingTranscript] = useState(false);
    const [editedTranscript, setEditedTranscript] = useState('');
    const [recordingId, setRecordingId] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const streamRef = useRef<MediaStream | null>(null);
    const blobRef = useRef<Blob | null>(null);
    const mimeTypeRef = useRef<string>('');

    const MAX_RETRIES = 3;

    // Poll for transcription after upload
    useEffect(() => {
        if (!recordingId || transcription) return;

        const pollTranscription = async () => {
            try {
                const response = await fetch(`/api/voice/transcription?recordingId=${recordingId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.transcription) {
                        setTranscription(data.transcription);
                        setEditedTranscript(data.transcription);
                        setState('recorded');
                        setUploadStatus('');

                        // Save transcription as the text input
                        const textKey = `step${stepNumber}Text`;
                        updateFormData({ [textKey]: data.transcription });
                    }
                }
            } catch (err) {
                console.error('Failed to fetch transcription:', err);
            }
        };

        // Poll every 2 seconds for up to 30 seconds
        const interval = setInterval(pollTranscription, 2000);
        const timeout = setTimeout(() => {
            clearInterval(interval);
            // If no transcription after 30s, just mark as done
            if (!transcription) {
                setState('recorded');
                setUploadStatus('');
            }
        }, 30000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [recordingId, transcription, stepNumber, updateFormData]);

    const uploadRecording = useCallback(async (blob: Blob, mimeType: string, attempt: number = 1) => {
        setState('uploading');
        setUploadStatus(attempt > 1 ? `Retrying... (${attempt}/${MAX_RETRIES})` : 'Uploading...');
        setError(null);

        const ext = mimeType.includes('ogg') ? 'ogg' : 'webm';

        try {
            const formData = new FormData();
            formData.append('file', blob, `recording.${ext}`);
            formData.append('sessionId', sessionId);
            formData.append('stepNumber', stepNumber.toString());

            const response = await fetch('/api/voice/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            setRecordingId(data.recordingId);
            setUploadStatus('Transcribing...');
            setState('transcribing');
            setRetryCount(0);

            // Only trigger transcription (skip extraction - it hallucinates)
            fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recordingId: data.recordingId }),
            }).catch(console.error);

            onUploadComplete?.(data.url, data.recordingId);

        } catch (err) {
            console.error(`Upload attempt ${attempt} failed:`, err);

            if (attempt < MAX_RETRIES) {
                setRetryCount(attempt);
                setTimeout(() => {
                    uploadRecording(blob, mimeType, attempt + 1);
                }, 1000 * attempt);
            } else {
                setError('Upload failed. Your recording is saved locally.');
                setState('error');
                setUploadStatus('');
                const recordingKey = `step${stepNumber}Recording`;
                updateFormData({ [recordingKey]: true });
            }
        }
    }, [sessionId, stepNumber, onUploadComplete, updateFormData]);

    const retryUpload = useCallback(() => {
        if (blobRef.current && mimeTypeRef.current) {
            uploadRecording(blobRef.current, mimeTypeRef.current, 1);
        }
    }, [uploadRecording]);

    const saveEditedTranscript = useCallback(() => {
        setTranscription(editedTranscript);
        setIsEditingTranscript(false);

        // Update form data with edited transcript
        const textKey = `step${stepNumber}Text`;
        updateFormData({ [textKey]: editedTranscript });
    }, [editedTranscript, stepNumber, updateFormData]);

    const startRecording = useCallback(async () => {
        try {
            setError(null);
            setTranscription(null);
            setRecordingId(null);
            setRetryCount(0);
            setIsEditingTranscript(false);
            setEditedTranscript('');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            let mimeType = 'audio/ogg';
            if (!MediaRecorder.isTypeSupported('audio/ogg')) {
                mimeType = 'audio/webm;codecs=opus';
            }

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const actualMimeType = mediaRecorderRef.current?.mimeType || mimeType;
                const blob = new Blob(chunksRef.current, { type: actualMimeType });
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                blobRef.current = blob;
                mimeTypeRef.current = actualMimeType;

                const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
                setDuration(finalDuration);
                onRecordingComplete?.(blob, finalDuration);

                const recordingKey = `step${stepNumber}Recording`;
                updateFormData({ [recordingKey]: true });

                uploadRecording(blob, actualMimeType, 1);

                streamRef.current?.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setState('recording');
            startTimeRef.current = Date.now();

            timerRef.current = setInterval(() => {
                setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
            }, 1000);

        } catch (err) {
            console.error('Failed to start recording:', err);
            setError('Could not access microphone. Please check permissions.');
        }
    }, [onRecordingComplete, uploadRecording, stepNumber, updateFormData]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && state === 'recording') {
            if (mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.requestData();
            }
            mediaRecorderRef.current.stop();
            setState('recorded');

            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    }, [state]);

    const resetRecording = useCallback(() => {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setAudioUrl(null);
        setDuration(0);
        setState('idle');
        setError(null);
        setUploadStatus('');
        setTranscription(null);
        setRecordingId(null);
        setRetryCount(0);
        setIsEditingTranscript(false);
        setEditedTranscript('');
        blobRef.current = null;
        mimeTypeRef.current = '';
    }, [audioUrl]);

    return (
        <div className="space-y-4">
            {/* Idle state */}
            {state === 'idle' && (
                <div className="relative">
                    <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 hover:border-primary hover:from-primary/5 hover:to-emerald-50 transition-all cursor-pointer"
                        onClick={startRecording}
                    >
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-emerald-500 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105">
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-gray-700">Tap to Record</p>
                            <p className="text-sm text-gray-500">Share your thoughts via voice</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Recording state */}
            {state === 'recording' && (
                <div className="relative">
                    <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-red-50 border-2 border-red-300">
                        <div className="relative">
                            <div className="absolute inset-0 w-20 h-20 rounded-full bg-red-400 animate-ping opacity-25"></div>
                            <button
                                onClick={stopRecording}
                                className="relative w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-all"
                            >
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                    <rect x="6" y="6" width="12" height="12" rx="2" />
                                </svg>
                            </button>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-red-600 tabular-nums">{formatDuration(duration)}</p>
                            <p className="text-red-500 font-medium flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                Recording... Tap to stop
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Recorded/Processing states */}
            {(state === 'recorded' || state === 'uploading' || state === 'transcribing' || state === 'error') && audioUrl && (
                <div className="space-y-4">
                    {/* Audio player card */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-800">Your Recording</p>
                                <p className="text-sm text-gray-500">{formatDuration(duration)}</p>
                            </div>
                            <button
                                onClick={resetRecording}
                                className="px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                            >
                                Re-record
                            </button>
                        </div>
                        {/* Audio player with iOS fallback */}
                        <audio
                            src={audioUrl}
                            controls
                            className="w-full h-10 rounded-lg"
                            onError={(e) => {
                                // Hide broken player on iOS
                                (e.target as HTMLAudioElement).style.display = 'none';
                                const fallback = (e.target as HTMLAudioElement).nextElementSibling;
                                if (fallback) (fallback as HTMLElement).style.display = 'flex';
                            }}
                        />
                        {/* Fallback for iOS/unsupported browsers */}
                        <div className="hidden items-center justify-center gap-2 py-3 px-4 bg-green-50 rounded-lg border border-green-200 text-green-700 text-sm">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Recording captured ({formatDuration(duration)})</span>
                        </div>
                    </div>

                    {/* Status indicator */}
                    {(state === 'uploading' || state === 'transcribing') && (
                        <div className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-50 rounded-xl border border-blue-200">
                            <svg className="w-5 h-5 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            <span className="text-blue-700 font-medium">{uploadStatus || 'Processing...'}</span>
                        </div>
                    )}

                    {/* Error with retry */}
                    {state === 'error' && (
                        <div className="flex items-center justify-between gap-3 py-3 px-4 bg-amber-50 rounded-xl border border-amber-200">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span className="text-amber-800 text-sm">{error}</span>
                            </div>
                            <button
                                onClick={retryUpload}
                                className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium flex-shrink-0"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Editable transcription */}
                    {transcription && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-green-700 font-semibold flex items-center gap-1.5 uppercase tracking-wide">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Transcribed
                                </p>
                                {!isEditingTranscript ? (
                                    <button
                                        onClick={() => setIsEditingTranscript(true)}
                                        className="text-xs text-green-700 hover:text-green-900 font-medium flex items-center gap-1"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                        Edit
                                    </button>
                                ) : null}
                            </div>

                            {isEditingTranscript ? (
                                <div className="space-y-2">
                                    <textarea
                                        value={editedTranscript}
                                        onChange={(e) => setEditedTranscript(e.target.value)}
                                        className="w-full p-3 text-gray-700 bg-white border border-green-300 rounded-lg resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="Edit your transcript..."
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => {
                                                setEditedTranscript(transcription);
                                                setIsEditingTranscript(false);
                                            }}
                                            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={saveEditedTranscript}
                                            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-700 leading-relaxed">{transcription}</p>
                            )}
                        </div>
                    )}

                    {/* Success when no transcription */}
                    {state === 'recorded' && !transcription && !error && (
                        <p className="text-center text-sm text-green-600 font-medium flex items-center justify-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Recording saved! You can continue.
                        </p>
                    )}
                </div>
            )}

            {/* Microphone error */}
            {error && state === 'idle' && (
                <p className="text-center text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>
            )}
        </div>
    );
}
