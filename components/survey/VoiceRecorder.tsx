'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { formatDuration } from '@/lib/utils';
import { useSurvey } from '@/components/providers/SurveyProvider';

interface VoiceRecorderProps {
    sessionId: string;
    stepNumber: number;
    onRecordingComplete?: (blob: Blob, duration: number) => void;
    onUploadComplete?: (url: string, recordingId: string) => void;
}

type RecordingState = 'idle' | 'recording' | 'recorded' | 'uploading';

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

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const streamRef = useRef<MediaStream | null>(null);

    const uploadRecording = useCallback(async (blob: Blob, mimeType: string) => {
        setState('uploading');
        setUploadStatus('Saving your response...');

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
            setUploadStatus('Processing...');

            // Trigger transcription
            await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recordingId: data.recordingId }),
            });

            // Trigger extraction
            await fetch('/api/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recordingId: data.recordingId }),
            });

            setUploadStatus('✓ Saved');
            setState('recorded');
            onUploadComplete?.(data.url, data.recordingId);

        } catch (err) {
            console.error('Upload failed:', err);
            setError('Upload failed. Recording saved locally.');
            setState('recorded');
        }
    }, [sessionId, stepNumber, onUploadComplete]);

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
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);

                const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
                setDuration(finalDuration);
                onRecordingComplete?.(blob, finalDuration);

                // Enable Continue button immediately - don't wait for upload
                const recordingKey = `step${stepNumber}Recording`;
                updateFormData({ [recordingKey]: true });

                // Upload in background - user can continue without waiting
                uploadRecording(blob, actualMimeType);

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
    }, [onRecordingComplete, uploadRecording]);

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
    }, [audioUrl]);

    return (
        <div className={`recorder-container ${state === 'recording' ? 'recording' : ''}`}>
            {error && (
                <div className="mb-4 p-4 bg-error/10 text-error rounded-xl text-sm border border-error/20">
                    {error}
                </div>
            )}

            {/* Idle State - One Big Clickable Button */}
            {state === 'idle' && (
                <div className="stagger-children text-center">
                    <button
                        onClick={startRecording}
                        className="group w-full flex flex-col items-center gap-4 p-6 rounded-2xl bg-white/50 border-2 border-dashed border-primary/30 hover:border-primary hover:bg-white/80 transition-all cursor-pointer"
                    >
                        <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-text-primary font-semibold text-lg">Tap to Start Recording</p>
                            <p className="text-text-muted text-sm mt-1">We&apos;re here to listen</p>
                        </div>
                    </button>
                </div>
            )}

            {/* Recording State - "Listening Ear" with ripples */}
            {state === 'recording' && (
                <div className="stagger-children">
                    {/* Ripple container */}
                    <div className="relative w-24 h-24 mx-auto mb-8">
                        {/* Ripples */}
                        <div className="recorder-ripple" />
                        <div className="recorder-ripple" />
                        <div className="recorder-ripple" />

                        {/* Center button */}
                        <button
                            onClick={stopRecording}
                            className="absolute inset-0 w-full h-full bg-gradient-to-br from-accent to-accent-light rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
                            style={{
                                boxShadow: '0 0 30px var(--accent-glow)',
                            }}
                        >
                            <div className="w-6 h-6 bg-white rounded-sm" />
                        </button>
                    </div>

                    {/* Timer */}
                    <div className="text-3xl font-bold text-accent mb-4 font-mono">
                        {formatDuration(duration)}
                    </div>

                    <p className="text-text-secondary mb-6 text-lg animate-gentle-pulse">
                        We&apos;re listening... Take your time.
                    </p>

                    <Button onClick={stopRecording} variant="secondary" size="lg">
                        <span className="text-xl">⏹️</span>
                        Finish Recording
                    </Button>
                </div>
            )}

            {/* Recorded/Uploading State */}
            {(state === 'recorded' || state === 'uploading') && audioUrl && (
                <div className="stagger-children">
                    {/* Audio player */}
                    <div className="p-4 bg-white/70 rounded-xl mb-4 border border-primary/10">
                        <audio src={audioUrl} controls className="w-full mb-2" />
                        <p className="text-sm text-text-muted text-center">
                            Duration: {formatDuration(duration)}
                        </p>
                    </div>

                    {/* Status */}
                    {state === 'uploading' && (
                        <div className="flex items-center justify-center gap-2 text-primary mb-4">
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span>{uploadStatus}</span>
                        </div>
                    )}

                    {state === 'recorded' && uploadStatus && (
                        <p className="text-success mb-4 font-medium">
                            {uploadStatus}
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 justify-center">
                        <Button
                            variant="secondary"
                            onClick={resetRecording}
                            disabled={state === 'uploading'}
                        >
                            Record Again
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
