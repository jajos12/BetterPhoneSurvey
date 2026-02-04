'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { formatDuration } from '@/lib/utils';
import { useSurvey } from '@/components/providers/SurveyProvider';

interface VoiceTextInputProps {
    sessionId: string;
    stepNumber: number;
    placeholder?: string;
    voiceOnly?: boolean;
}

type RecordingState = 'idle' | 'recording' | 'saved';

export function VoiceTextInput({
    sessionId,
    stepNumber,
    placeholder = 'You can type your response here',
    voiceOnly = false
}: VoiceTextInputProps) {
    const { updateFormData, formData } = useSurvey();

    // Text state
    const fieldKey = `step${stepNumber}Text`;
    const recordingKey = `step${stepNumber}Recording`;
    const data = formData as Record<string, unknown>;
    const savedText = (data[fieldKey] as string) || '';
    const hasRecording = !!(data[recordingKey]);
    const [text, setText] = useState(savedText);

    // Recording state - initialize as 'saved' if already has a recording
    const [recordingState, setRecordingState] = useState<RecordingState>(hasRecording ? 'saved' : 'idle');
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const streamRef = useRef<MediaStream | null>(null);

    // Sync with formData
    useEffect(() => {
        const newSavedText = (data[fieldKey] as string) || '';
        if (newSavedText && newSavedText !== text) {
            setText(newSavedText);
        }
    }, [data, fieldKey]);

    const handleTextChange = (newText: string) => {
        setText(newText);
        updateFormData({ [fieldKey]: newText });
    };

    // Upload in background - no waiting
    const uploadRecording = useCallback(async (blob: Blob, mimeType: string) => {
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

            const result = await response.json();

            // Trigger async transcription (fire and forget)
            fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recordingId: result.recordingId }),
            }).catch(console.error);

        } catch (err) {
            console.error('Upload failed:', err);
            // Don't show error to user - it's already "saved" from their perspective
        }
    }, [sessionId, stepNumber]);

    const startRecording = useCallback(async () => {
        try {
            setError(null);
            setRecordingState('idle');

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Prefer webm/opus - it's the modern standard for voice
            let mimeType = 'audio/webm;codecs=opus';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                // Fallback to plain webm
                if (MediaRecorder.isTypeSupported('audio/webm')) {
                    mimeType = 'audio/webm';
                } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
                    mimeType = 'audio/ogg;codecs=opus';
                } else {
                    mimeType = 'audio/ogg'; // Final fallback
                }
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

                // Mark as saved IMMEDIATELY
                updateFormData({ [recordingKey]: true });
                setRecordingState('saved');

                // Upload in background (user doesn't wait)
                uploadRecording(blob, actualMimeType);

                streamRef.current?.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setRecordingState('recording');
            startTimeRef.current = Date.now();

            timerRef.current = setInterval(() => {
                setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
            }, 1000);

        } catch (err) {
            console.error('Failed to start recording:', err);
            setError('Could not access microphone');
        }
    }, [stepNumber, updateFormData, uploadRecording]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && recordingState === 'recording') {
            if (mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.requestData();
            }
            mediaRecorderRef.current.stop();

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            setDuration(0);
        }
    }, [recordingState]);

    const resetRecording = useCallback(() => {
        setRecordingState('idle');
        updateFormData({ [recordingKey]: false });
    }, [recordingKey, updateFormData]);

    return (
        <div className="space-y-4">
            {/* Text input option */}
            {!voiceOnly && (
                <>
                    <div>
                        <textarea
                            className="w-full min-h-[120px] p-4 rounded-2xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 resize-y focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-base leading-relaxed"
                            placeholder={placeholder}
                            value={text}
                            onChange={(e) => handleTextChange(e.target.value)}
                            disabled={recordingState === 'recording'}
                        />
                    </div>

                    {/* OR divider */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="text-sm text-gray-400 font-medium">or record a voice memo</span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                    </div>
                </>
            )}

            {/* Voice recording option - SEPARATE from text box */}
            <div className="flex flex-col items-center gap-4">
                {voiceOnly && recordingState === 'idle' && (
                    <p className="text-sm text-text-secondary text-center px-4 italic">
                        {placeholder}
                    </p>
                )}

                {recordingState === 'recording' && (
                    <p className="text-sm font-medium text-primary animate-pulse text-center px-4">
                        Recording... {placeholder}
                    </p>
                )}

                {recordingState === 'idle' && (
                    <button
                        type="button"
                        onClick={startRecording}
                        className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 hover:border-primary hover:from-primary/5 hover:to-emerald-50 transition-all group"
                    >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-emerald-500 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-gray-700">Tap to Record</p>
                            <p className="text-sm text-gray-500">Speak your answer</p>
                        </div>
                    </button>
                )}

                {recordingState === 'recording' && (
                    <button
                        type="button"
                        onClick={stopRecording}
                        className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-red-50 border-2 border-red-300"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 w-12 h-12 rounded-full bg-red-400 animate-ping opacity-30"></div>
                            <div className="relative w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <rect x="6" y="6" width="12" height="12" rx="2" />
                                </svg>
                            </div>
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-red-600 tabular-nums">{formatDuration(duration)}</p>
                            <p className="text-sm text-red-500">Tap to stop</p>
                        </div>
                    </button>
                )}

                {recordingState === 'saved' && (
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-green-50 border-2 border-green-200">
                            <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-green-700">Saved!</p>
                                <button
                                    onClick={resetRecording}
                                    className="text-sm text-green-600 hover:text-green-800 underline"
                                >
                                    Record again
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Error message */}
            {error && (
                <p className="text-center text-sm text-red-600">{error}</p>
            )}
        </div>
    );
}
