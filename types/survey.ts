// Survey type definitions

export type PainCheckValue = 'crisis' | 'yes' | 'sometimes' | 'no';

export interface SurveyFormData {
    // Pain check
    painCheck: PainCheckValue | null;

    // Step 1: Voice - Brain dump
    voiceStep1?: string; // URL to recording

    // Step 2: Issues checkboxes
    issues: string[];
    issueOther?: string;

    // Step 3: Ranking
    ranking: string[];

    // Step 4: Voice - Urgency
    voiceStep4?: string;

    // Step 5: Voice - Solutions tried
    voiceStep5?: string;

    // Step 6: Voice - Switching concerns
    voiceStep6?: string;

    // Step 7: Benefits checkboxes
    benefits: string[];

    // Step 8: Demographics
    kidAges: string;
    kidsWithPhones: string;
    currentDevice: string;
    deviceDuration: string;
    dailyUsage: string;
    familyStructure: string;
    householdIncome: string;

    // Step 9: Advice sources
    adviceSources?: string[];

    // Step 10: Price willingness
    priceWillingness?: string;

    // Step 11: Click motivation
    clickMotivation: string;

    // Step 12: Anything else
    anythingElse: string;

    // Email
    emailOptIn: boolean;
    email: string;
}

export interface SurveySession {
    id: string;
    sessionId: string;
    userId?: string;
    currentStep: string;
    formData: Partial<SurveyFormData>;
    isCompleted: boolean;
    startedAt: string;
    completedAt?: string;
    email?: string;
}

export interface VoiceRecording {
    id: string;
    sessionId: string;
    stepNumber: number;
    fileUrl: string;
    duration: number;
    transcript?: string;
    extractedData?: Record<string, unknown>;
    processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: string;
}

export interface StepConfig {
    id: string;
    path: string;
    type: 'gate' | 'voice' | 'checkbox' | 'ranking' | 'form' | 'text' | 'choice' | 'email' | 'thank-you';
    title: string;
    description?: string;
    hasVoice?: boolean;
}

export interface SurveyContextType {
    sessionId: string;
    formData: Partial<SurveyFormData>;
    updateFormData: (data: Partial<SurveyFormData>) => void;
    isLoading: boolean;
    error: string | null;
}
