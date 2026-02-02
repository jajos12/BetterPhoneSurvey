'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { formatDuration } from '@/lib/utils';

interface VoiceRecorderProps {
    onRecordingComplete: (blob: Blob, duration: number) => void;
    onUpload?: (url: string) => void;
    isUploading?: boolean;
}

type RecordingState = 'idle' | 'recording' | 'recorded';

export function VoiceRecorder({ onRecordingComplete, isUploading = false }: VoiceRecorderProps) {
    const [state, setState] = useState<RecordingState>('idle');
    const [duration, setDuration] = useState(0);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    const startRecording = useCallback(async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                onRecordingComplete(blob, duration);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            // Start recording
            mediaRecorder.start(1000);
            setState('recording');
            startTimeRef.current = Date.now();

            // Update timer every second
            timerRef.current = setInterval(() => {
                setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
            }, 1000);

        } catch (err) {
            console.error('Failed to start recording:', err);
            setError('Could not access microphone. Please check permissions.');
        }
    }, [duration, onRecordingComplete]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && state === 'recording') {
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
    }, [audioUrl]);

    return (
        <div className="bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20 rounded-2xl p-8 text-center">
            {error && (
                <div className="mb-4 p-3 bg-error/10 text-error rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Idle State */}
            {state === 'idle' && (
                <>
                    <div className="mb-6">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-text-secondary mb-4">
                        Click to record your response
                    </p>
                    <Button onClick={startRecording}>
                        <span className="text-xl">🎙️</span>
                        Start Recording
                    </Button>
                </>
            )}

            {/* Recording State */}
            {state === 'recording' && (
                <>
                    <div className="flex items-center justify-center gap-3 text-2xl font-bold text-error mb-6">
                        <span className="w-3 h-3 bg-error rounded-full animate-pulse-slow" />
                        {formatDuration(duration)}
                    </div>
                    <p className="text-text-secondary mb-4">
                        Recording... Click to stop
                    </p>
                    <Button
                        onClick={stopRecording}
                        className="bg-gradient-to-br from-error to-red-600 hover:shadow-red-500/30"
                    >
                        <span className="text-xl">⏹️</span>
                        Stop Recording
                    </Button>
                </>
            )}

            {/* Recorded State */}
            {state === 'recorded' && audioUrl && (
                <>
                    <div className="p-4 bg-white/60 rounded-xl mb-4">
                        <audio src={audioUrl} controls className="w-full mb-3" />
                        <p className="text-sm text-text-muted">
                            Duration: {formatDuration(duration)}
                        </p>
                    </div>

                    <div className="flex gap-3 justify-center">
                        <Button variant="secondary" onClick={resetRecording} disabled={isUploading}>
                            Re-record
                        </Button>
                        {isUploading && (
                            <span className="text-sm text-text-muted flex items-center gap-2">
                                <span className="animate-spin">⏳</span> Uploading...
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-success mt-4">
                        ✓ Recording complete
                    </p>
                </>
            )}
        </div>
    );
}
