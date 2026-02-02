'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { SurveyFormData, SurveyContextType } from '@/types/survey';
import { getSessionId } from '@/lib/utils';

const SurveyContext = createContext<SurveyContextType | null>(null);

const STORAGE_KEY = 'betterphone_survey_data';

export function SurveyProvider({ children }: { children: ReactNode }) {
    const [sessionId, setSessionId] = useState('');
    const [formData, setFormData] = useState<Partial<SurveyFormData>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
