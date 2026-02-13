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

    // Step 8: Enforcement dynamics
    enforcementSource?: string;
    teacherConsistency?: string;
    teacherSupport?: string;

    // Step 9: Voice - Ideal solution
    step9Text?: string;
    step9Recording?: boolean;

    // Step 10: School profile
    schoolType?: string;
    gradeLevel?: string;
    enrollment?: string;
    smartphonePercent?: number;
    schoolLocation?: string;
    adminRole?: string;

    // Step 11: Current policy
    currentPolicy?: string;
    currentPolicyOther?: string;
    compliancePercent?: number;

    // Step 12: Budget
    budgetRange?: string;

    // Step 13: Decision process
    step13Text?: string;
    step13Recording?: boolean;

    // Step 14: Pilot interest
    pilotInterest?: string;

    // Step 15: Contact opt-in
    callInterest?: string;
    contactPhone?: string;
    contactPreferredTime?: string;
    contactName?: string;

    // Step 16: Anything else
    step16Text?: string;
    step16Recording?: boolean;

    // Meta
    currentStep?: string;
    isCompleted?: boolean;
    surveyType: 'school_admin';
}
