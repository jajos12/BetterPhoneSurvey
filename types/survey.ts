// Survey type definitions

export type PainCheckValue = 'crisis' | 'yes' | 'sometimes' | 'no';

export interface SurveyFormData {
    // Pain check
    painCheck: PainCheckValue | null;

    // Step 1: Voice - Brain dump
    step1Text?: string;
    step1Recording?: boolean;

    // Step 2: Issues checkboxes
    issues: string[];
    issueOther?: string;

    // Step 3: Ranking
    ranking: string[];

    // Step 4: Voice - Urgency
    step4Text?: string;
    step4Recording?: boolean;

    // Step 5: Voice - Solutions tried
    step5Text?: string;
    step5Recording?: boolean;

    // Step 6: Voice - Switching concerns
    step6Text?: string;
    step6Recording?: boolean;

    // Step 7: Benefits checkboxes
    benefits: string[];

    // Step 8: Demographics + Voice
    kidAges?: string;
    kidsWithPhones?: string;
    currentDevice?: string;
    deviceDuration?: string;
    dailyUsage?: string;
    familyStructure?: string;
    householdIncome?: string;
    step8Text?: string;
    step8Recording?: boolean;

    // Step 9: Advice sources
    adviceSources?: string[];

    // Step 10: Price willingness (Multi-select)
    priceWillingness?: string[];

    // Step 11: Click motivation
    step11Text?: string;
    step11Recording?: boolean;

    // Step 12: Anything else
    step12Text?: string;
    step12Recording?: boolean;

    // Meta
    currentStep?: string;
    isCompleted?: boolean;

    // Referral tracking
    knowsOthersWithStress?: boolean;

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
