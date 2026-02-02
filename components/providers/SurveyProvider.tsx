'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import type { SurveyFormData, SurveyContextType } from '@/types/survey';
import { getSessionId } from '@/lib/utils';

const SurveyContext = createContext<SurveyContextType | null>(null);

const STORAGE_KEY = 'betterphone_survey_data';

export function SurveyProvider({ children }: { children: ReactNode }) {
    const [sessionId, setSessionId] = useState('');
    const [formData, setFormData] = useState<Partial<SurveyFormData>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const sessionCreatedRef = useRef(false);

    // Load session and form data on mount
    useEffect(() => {
        const sid = getSessionId();
        setSessionId(sid);

        // Load from localStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setFormData(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse saved data:', e);
            }
        }
        setIsLoading(false);
    }, []);

    // Create survey_response record in Supabase on session init
    // This ensures the record exists before any voice recordings are uploaded
    useEffect(() => {
        if (!sessionId || sessionCreatedRef.current) return;

        const createSession = async () => {
            try {
                const response = await fetch('/api/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId,
                        currentStep: 'intro',
                        isCompleted: false,
                    }),
                });

                if (response.ok) {
                    sessionCreatedRef.current = true;
                    console.log('Session created:', sessionId);
                }
            } catch (err) {
                console.error('Failed to create session:', err);
            }
        };

        createSession();
    }, [sessionId]);

    // Save to localStorage whenever formData changes
    useEffect(() => {
        if (!isLoading && Object.keys(formData).length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
        }
    }, [formData, isLoading]);

    const updateFormData = (data: Partial<SurveyFormData>) => {
        setFormData(prev => ({ ...prev, ...data }));
    };

    return (
        <SurveyContext.Provider value={{ sessionId, formData, updateFormData, isLoading, error }}>
            {children}
        </SurveyContext.Provider>
    );
}

export function useSurvey() {
    const context = useContext(SurveyContext);
    if (!context) {
        throw new Error('useSurvey must be used within a SurveyProvider');
    }
    return context;
}

