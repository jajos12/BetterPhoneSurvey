'use client';

import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import type { SchoolAdminFormData } from '@/types/school-admin';
import { getSessionId } from '@/lib/utils';

interface SchoolAdminContextType {
    sessionId: string;
    formData: Partial<SchoolAdminFormData>;
    updateFormData: (data: Partial<SchoolAdminFormData>) => void;
    isLoading: boolean;
}

const SchoolAdminContext = createContext<SchoolAdminContextType | null>(null);

const STORAGE_KEY = 'betterphone_school_admin_data';

export function SchoolAdminProvider({ children }: { children: ReactNode }) {
    const [sessionId, setSessionId] = useState('');
    const [formData, setFormData] = useState<Partial<SchoolAdminFormData>>({ surveyType: 'school_admin' });
    const [isLoading, setIsLoading] = useState(true);
    const sessionCreatedRef = useRef(false);

    // Load session on mount
    useEffect(() => {
        // Use a separate prefix for school admin sessions
        const sid = getSessionId('school_admin_');
        setSessionId(sid);

        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setFormData({ ...JSON.parse(saved), surveyType: 'school_admin' });
            } catch (e) {
                console.error('Failed to parse saved school admin data:', e);
            }
        }
        setIsLoading(false);
    }, []);

    // Create database record on session init
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
                        surveyType: 'school_admin',
                    }),
                });

                if (response.ok) {
                    sessionCreatedRef.current = true;
                }
            } catch (err) {
                console.error('Failed to create school admin session:', err);
            }
        };

        createSession();
    }, [sessionId]);

    // Persist to localStorage
    useEffect(() => {
        if (!isLoading && Object.keys(formData).length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
        }
    }, [formData, isLoading]);

    const updateFormData = (data: Partial<SchoolAdminFormData>) => {
        setFormData(prev => ({ ...prev, ...data }));
    };

    return (
        <SchoolAdminContext.Provider value={{ sessionId, formData, updateFormData, isLoading }}>
            {children}
        </SchoolAdminContext.Provider>
    );
}

export function useSchoolAdmin() {
    const context = useContext(SchoolAdminContext);
    if (!context) {
        throw new Error('useSchoolAdmin must be used within a SchoolAdminProvider');
    }
    return context;
}
