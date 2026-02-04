'use client';

import { useState, useRef, useEffect } from 'react';

interface AudioPlayerProps {
    src: string;
}

export function AudioPlayer({ src }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Reset error when source changes (e.g. after signed URL refreshes)
    useEffect(() => {
        setError(null);
        setIsPlaying(false);
        setProgress(0);
    }, [src]);

    const togglePlay = async () => {
        if (!src) {
            setError('Missing source');
            return;
        }

        if (audioRef.current) {
            try {
                if (isPlaying) {
                    audioRef.current.pause();
                    setIsPlaying(false);
                } else {
                    setError(null);
                    // Force a load if it failed before
                    if (audioRef.current.readyState === 0) {
                        audioRef.current.load();
                    }

                    const playPromise = audioRef.current.play();

                    if (playPromise !== undefined) {
                        playPromise
                            .then(() => {
                                setIsPlaying(true);
                            })
                            .catch(err => {
                                console.error("Playback failed:", err);
                                setError("Source Error");
                                setIsPlaying(false);
                            });
                    }
                }
            } catch (err) {
                console.error("Audio state error:", err);
                setError("Playback Failed");
            }
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const current = audioRef.current.currentTime;
            const duration = audioRef.current.duration;
            if (duration) {
                setProgress((current / duration) * 100);
            }
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
    };

    const handleLoadError = () => {
        setError("Invalid Source");
        setIsPlaying(false);
    };

    return (
        <div className={`bg-white/5 border rounded-2xl p-4 flex items-center gap-4 group transition-all ${error ? 'border-red-500/20' : 'border-white/5 hover:border-white/10'
            }`}>
            <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onError={handleLoadError}
                className="hidden"
                preload="metadata"
            >
                <source src={src} type="audio/webm" />
                <source src={src} type="audio/ogg" />
                <source src={src} type="audio/mpeg" />
            </audio>

            <button
                onClick={togglePlay}
                disabled={!!error && error !== 'Source Error'}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] ${error
                    ? 'bg-red-500/20 text-red-400 cursor-not-allowed'
                    : 'bg-white text-black hover:scale-105 active:scale-95'
                    }`}
            >
                {error ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                ) : isPlaying ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                )}
            </button>

            <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black tracking-widest uppercase">
                    <span className={error ? 'text-red-400' : 'text-white/20'}>
                        {error ? `ERROR: ${error}` : 'VOICE_INTAKE'}
                    </span>
                    <span className={error ? 'text-red-400/50' : 'text-white/20'}>
                        {error ? 'UNAVAILABLE' : isPlaying ? 'PLAYING' : 'READY'}
                    </span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                    <div
                        className={`absolute h-full transition-all duration-100 ease-linear ${error ? 'bg-red-500/40' : 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]'
                            }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
