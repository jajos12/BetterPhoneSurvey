import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Generate unique session ID
export function generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Get or create session ID from localStorage
export function getSessionId(prefix: string = 'sess_'): string {
    if (typeof window === 'undefined') return '';

    let sessionId = localStorage.getItem('betterphone_session_id');
    if (!sessionId) {
        sessionId = generateSessionId();
        localStorage.setItem('betterphone_session_id', sessionId);
    }
    return sessionId;
}

// Format duration for voice recordings
export function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
