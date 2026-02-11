// School Admin Survey form data types

export interface SchoolAdminFormData {
    // Gate: Disruption frequency
    disruptionFrequency: string | null;

    // Email capture
    email: string;
    emailOptIn: boolean;

    // Step 1: Discovery motivation
    step1Text?: string;
    step1Recording?: boolean;

    // Step 2: Voice - Biggest challenge
    step2Text?: string;
    step2Recording?: boolean;

    // Step 3: Issues multi-select
    schoolIssues: string[];

    // Step 4: Ranking
    issueRanking: string[];

    // Step 5: Solutions tried
    solutionsTried: string[];
    solutionsTriedOther?: string;

    // Step 6: Solution effectiveness (map of solution -> effectiveness)
    solutionEffectiveness: Record<string, string>;

    // Step 7: Voice - Barriers
    step7Text?: string;
    step7Recording?: boolean;

    // Step 8: School profile
    schoolType?: string;
    gradeLevel?: string;
    enrollment?: string;
    smartphonePercent?: number;
    schoolLocation?: string;
    adminRole?: string;

    // Step 9: Current policy
    currentPolicy?: string;
    currentPolicyOther?: string;
    compliancePercent?: number;

    // Step 10: Budget
    budgetRange?: string;

    // Step 11: Decision process
    step11Text?: string;
    step11Recording?: boolean;

    // Step 12: Pilot interest
    pilotInterest?: string;

    // Step 13: Contact opt-in
    callInterest?: string;
    contactPhone?: string;
    contactPreferredTime?: string;
    contactName?: string;

    // Step 14: Anything else
    step14Text?: string;
    step14Recording?: boolean;

    // Meta
    currentStep?: string;
    isCompleted?: boolean;
    surveyType: 'school_admin';
}
