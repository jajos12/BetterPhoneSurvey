'use client';

import { useState, useEffect } from 'react';
import { VoiceRecorder } from './VoiceRecorder';
import { useSurvey } from '@/components/providers/SurveyProvider';

interface VoiceTextInputProps {
    sessionId: string;
    stepNumber: number;
    placeholder?: string;
}

export function VoiceTextInput({
    sessionId,
    stepNumber,
    placeholder = 'Type your response here...'
}: VoiceTextInputProps) {
    const [mode, setMode] = useState<'voice' | 'text'>('voice');
    const { updateFormData, formData } = useSurvey();

    // Field key based on step number
    const fieldKey = `step${stepNumber}Text`;

    // Initialize from formData
    const data = formData as Record<string, unknown>;
    const savedText = (data[fieldKey] as string) || '';
    const [localText, setLocalText] = useState(savedText);

    // Sync local state with formData when it changes
    useEffect(() => {
        const newSavedText = (data[fieldKey] as string) || '';
        if (newSavedText && newSavedText !== localText) {
            setLocalText(newSavedText);
        }
    }, [data, fieldKey, localText]);

    const handleTextChange = (text: string) => {
        setLocalText(text);
        // Save to form data immediately
        updateFormData({ [fieldKey]: text });
    };

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

            {/* Both components always mounted, toggle visibility to preserve state */}
            <div className={mode === 'voice' ? 'block' : 'hidden'}>
                <VoiceRecorder sessionId={sessionId} stepNumber={stepNumber} />
            </div>

            <div className={mode === 'text' ? 'block' : 'hidden'}>
                <div className="space-y-3">
                    <textarea
                        className="w-full min-h-[150px] p-4 rounded-xl border-2 border-gray-200 bg-white text-gray-900 placeholder-gray-400 resize-y focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder={placeholder}
                        value={localText}
                        onChange={(e) => handleTextChange(e.target.value)}
                    />
                    <p className="text-sm text-text-muted">
                        Take your time to share your thoughts
                    </p>
                </div>
            </div>
        </div>
    );
}
