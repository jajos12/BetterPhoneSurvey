'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { SurveyFormData, SurveyContextType } from '@/types/survey';
import { getSessionId } from '@/lib/utils';

const SurveyContext = createContext<SurveyContextType | null>(null);

const DEFAULT_STORAGE_KEY = 'betterphone_survey_data';
const DEFAULT_SESSION_KEY = 'betterphone_session_id';

interface SurveyProviderProps {
    children: ReactNode;
    storageKey?: string;
    sessionKey?: string;
    sessionPrefix?: string;
    initialData?: Partial<SurveyFormData>;
}

export function SurveyProvider({
    children,
    storageKey = DEFAULT_STORAGE_KEY,
    sessionKey = DEFAULT_SESSION_KEY,
    sessionPrefix = 'sess_',
    initialData = {},
}: SurveyProviderProps) {
    const baseFormData = initialData;
    const [sessionId] = useState(() => getSessionId(sessionPrefix, sessionKey));
    const [formData, setFormData] = useState<Partial<SurveyFormData>>(() => {
        if (typeof window === 'undefined') {
            return baseFormData;
        }

        const saved = localStorage.getItem(storageKey);
        if (!saved) {
            return baseFormData;
        }

        try {
            return {
                ...baseFormData,
                ...JSON.parse(saved),
            };
        } catch (e) {
            console.error('Failed to parse saved data:', e);
            return baseFormData;
        }
    });
    const [isLoading] = useState(false);
    const [error] = useState<string | null>(null);

    // Create survey_response record in Supabase on session init
    // This ensures the record exists before any voice recordings are uploaded
    useEffect(() => {
        if (!sessionId) return;

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
                    console.log('Session created:', sessionId);
                }
            } catch (err) {
                console.error('Failed to create session:', err);
            }
        };

        void createSession();
    }, [sessionId]);

    // Save to localStorage whenever formData changes
    useEffect(() => {
        if (!isLoading && Object.keys(formData).length > 0) {
            localStorage.setItem(storageKey, JSON.stringify(formData));
        }
    }, [formData, isLoading, storageKey]);

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

