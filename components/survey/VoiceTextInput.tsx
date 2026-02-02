'use client';

import { useState } from 'react';
import { VoiceRecorder } from './VoiceRecorder';

interface VoiceTextInputProps {
    sessionId: string;
    stepNumber: number;
    onTextChange?: (text: string) => void;
    textValue?: string;
    placeholder?: string;
}

export function VoiceTextInput({
    sessionId,
    stepNumber,
    onTextChange,
    textValue = '',
    placeholder = 'Type your response here...'
}: VoiceTextInputProps) {
    const [mode, setMode] = useState<'voice' | 'text'>('voice');

    return (
        <div className="space-y-4">
            {/* Toggle */}
            <div className="input-toggle">
                <button
                    type="button"
                    className={`input-toggle-option ${mode === 'voice' ? 'active' : ''}`}
                    onClick={() => setMode('voice')}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Voice Memo
                </button>
                <button
                    type="button"
                    className={`input-toggle-option ${mode === 'text' ? 'active' : ''}`}
                    onClick={() => setMode('text')}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Type Instead
                </button>
            </div>

            {/* Content based on mode */}
            {mode === 'voice' ? (
                <VoiceRecorder sessionId={sessionId} stepNumber={stepNumber} />
            ) : (
                <div className="recorder-container">
                    <textarea
                        className="input-base textarea-input"
                        placeholder={placeholder}
                        value={textValue}
                        onChange={(e) => onTextChange?.(e.target.value)}
                    />
                    <p className="text-sm text-text-muted mt-3">
                        Take your time to share your thoughts
                    </p>
                </div>
            )}
        </div>
    );
}
