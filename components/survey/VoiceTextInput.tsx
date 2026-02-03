'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { formatDuration } from '@/lib/utils';
import { useSurvey } from '@/components/providers/SurveyProvider';

interface VoiceTextInputProps {
    sessionId: string;
    stepNumber: number;
    placeholder?: string;
}

type RecordingState = 'idle' | 'recording' | 'processing';

export function VoiceTextInput({
    sessionId,
    stepNumber,
    placeholder = 'Type your thoughts here, or tap the mic to speak...'
}: VoiceTextInputProps) {
    const { updateFormData, formData } = useSurvey();

    // Text state
    const fieldKey = `step${stepNumber}Text`;
    const data = formData as Record<string, unknown>;
    const savedText = (data[fieldKey] as string) || '';
    const [text, setText] = useState(savedText);

    // Recording state
    const [recordingState, setRecordingState] = useState<RecordingState>('idle');
    const [duration, setDuration] = useState(0);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [recordingId, setRecordingId] = useState<string | null>(null);
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

    // Poll for transcription
    useEffect(() => {
        if (!recordingId || !isTranscribing) return;

        const pollTranscription = async () => {
            try {
                const response = await fetch(`/api/voice/transcription?recordingId=${recordingId}`);
                if (response.ok) {
                    const result = await response.json();
                    if (result.transcription) {
                        // Append transcription to existing text
                        const newText = text ? `${text}\n\n${result.transcription}` : result.transcription;
                        setText(newText);
                        updateFormData({ [fieldKey]: newText });
                        setIsTranscribing(false);
                        setRecordingId(null);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch transcription:', err);
            }
        };

        const interval = setInterval(pollTranscription, 2000);
        const timeout = setTimeout(() => {
            clearInterval(interval);
            setIsTranscribing(false);
        }, 30000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [recordingId, isTranscribing, text, fieldKey, updateFormData]);

    const handleTextChange = (newText: string) => {
        setText(newText);
        updateFormData({ [fieldKey]: newText });
    };

    const uploadAndTranscribe = useCallback(async (blob: Blob, mimeType: string) => {
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
            setRecordingId(result.recordingId);
            setIsTranscribing(true);

            // Trigger transcription
            fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recordingId: result.recordingId }),
            }).catch(console.error);

            // Mark as having a recording
            const recordingKey = `step${stepNumber}Recording`;
            updateFormData({ [recordingKey]: true });

        } catch (err) {
            console.error('Upload failed:', err);
            setError('Recording saved but upload failed. Please type your response.');
            setRecordingState('idle');
        }
    }, [sessionId, stepNumber, updateFormData]);

    const startRecording = useCallback(async () => {
        try {
            setError(null);
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

                setRecordingState('processing');
                uploadAndTranscribe(blob, actualMimeType);

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
            setError('Could not access microphone. Please type your response.');
        }
    }, [uploadAndTranscribe]);

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

    return (
        <div className="space-y-3">
            {/* Main input area */}
            <div className="relative">
                <textarea
                    className="w-full min-h-[140px] p-4 pr-16 rounded-2xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 resize-y focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-base leading-relaxed"
                    placeholder={placeholder}
                    value={text}
                    onChange={(e) => handleTextChange(e.target.value)}
                    disabled={recordingState === 'recording'}
                />

                {/* Mic button - always visible */}
                <div className="absolute right-3 bottom-3">
                    {recordingState === 'idle' && (
                        <button
                            type="button"
                            onClick={startRecording}
                            className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-emerald-500 text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
                            title="Record voice"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </button>
                    )}

                    {recordingState === 'recording' && (
                        <button
                            type="button"
                            onClick={stopRecording}
                            className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg animate-pulse"
                            title="Stop recording"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <rect x="6" y="6" width="12" height="12" rx="2" />
                            </svg>
                        </button>
                    )}

                    {recordingState === 'processing' && (
                        <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center">
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                        </div>
                    )}
                </div>
            </div>

            {/* Status messages */}
            {recordingState === 'recording' && (
                <div className="flex items-center justify-center gap-2 py-2 px-4 bg-red-50 rounded-xl border border-red-200">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <span className="text-red-700 font-medium">Recording... {formatDuration(duration)}</span>
                    <button
                        onClick={stopRecording}
                        className="ml-2 text-red-600 hover:text-red-800 text-sm underline"
                    >
                        Stop
                    </button>
                </div>
            )}

            {isTranscribing && (
                <div className="flex items-center justify-center gap-2 py-2 px-4 bg-blue-50 rounded-xl border border-blue-200">
                    <svg className="w-4 h-4 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span className="text-blue-700 text-sm">Transcribing your voice...</span>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 py-2 px-4 bg-amber-50 rounded-xl border border-amber-200">
                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-amber-800 text-sm">{error}</span>
                </div>
            )}

            {/* Helper text */}
            <p className="text-sm text-gray-500 text-center">
                Type your thoughts or tap the <span className="text-primary">mic</span> to speak
            </p>
        </div>
    );
}
