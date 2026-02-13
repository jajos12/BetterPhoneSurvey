// School Admin Survey — Step Configuration
import type { StepConfig } from '@/types/survey';

export const ADMIN_STEPS: StepConfig[] = [
    {
        id: 'disruption-gate',
        path: '/school-admin/disruption-gate',
        type: 'gate',
        title: 'Before we begin...',
        description: 'How often do student phones or personal devices cause disruption or concern at your school?',
    },
    {
        id: 'email',
        path: '/school-admin/email',
        type: 'email',
        title: 'Stay Connected',
        description: 'Where should we send information about solutions for your school?',
    },
    {
        id: '1',
        path: '/school-admin/step/1',
        type: 'text',
        title: 'What caught your attention?',
        description: 'What made you want to take this survey today?',
    },
    {
        id: '2',
        path: '/school-admin/step/2',
        type: 'voice',
        title: 'The Biggest Challenge',
        description: 'What is the single most challenging thing about student phones in your school right now?',
        hasVoice: true,
    },
    {
        id: '3',
        path: '/school-admin/step/3',
        type: 'checkbox',
        title: 'Problem Identification',
        description: 'Select all issues you\'re experiencing at your school.',
    },
    {
        id: '4',
        path: '/school-admin/step/4',
        type: 'ranking',
        title: 'Priority Ranking',
        description: 'Rank the issues you selected from most disruptive (top) to least disruptive (bottom).',
    },
    {
        id: '5',
        path: '/school-admin/step/5',
        type: 'checkbox',
        title: 'Past Solutions',
        description: 'What has your school already tried to manage student phone use?',
    },
    {
        id: '6',
        path: '/school-admin/step/6',
        type: 'form',
        title: 'Solution Effectiveness',
        description: 'For each solution you tried, how well did it work?',
    },
    {
        id: '7',
        path: '/school-admin/step/7',
        type: 'voice',
        title: 'Barriers & Requirements',
        description: 'What would make it hard to implement a new phone solution at your school?',
        hasVoice: true,
    },
    {
        id: '8',
        path: '/school-admin/step/8',
        type: 'form',
        title: 'Enforcement Dynamics',
        description: 'Help us understand where enforcement challenges come from and how teachers experience it.',
    },
    {
        id: '9',
        path: '/school-admin/step/9',
        type: 'voice',
        title: 'Your Ideal Solution',
        description: 'Forget what\'s been tried before. If you could wave a magic wand, what would the perfect phone solution look like for your school?',
        hasVoice: true,
    },
    {
        id: '10',
        path: '/school-admin/step/10',
        type: 'form',
        title: 'School Profile',
        description: 'Tell us about your school.',
    },
    {
        id: '11',
        path: '/school-admin/step/11',
        type: 'form',
        title: 'Current Policy',
        description: 'What is your school\'s current phone policy?',
    },
    {
        id: '12',
        path: '/school-admin/step/12',
        type: 'choice',
        title: 'Budget',
        description: 'What price range per student device would your school consider?',
    },
    {
        id: '13',
        path: '/school-admin/step/13',
        type: 'text',
        title: 'Decision Process',
        description: 'Who makes decisions about phone policies and technology purchases at your school?',
    },
    {
        id: '14',
        path: '/school-admin/step/14',
        type: 'choice',
        title: 'Pilot Interest',
        description: 'Would your school be interested in learning more or piloting a solution?',
    },
    {
        id: '15',
        path: '/school-admin/step/15',
        type: 'form',
        title: 'Schedule a Call',
        description: 'Would you be open to a brief call to discuss your school\'s challenges?',
    },
    {
        id: '16',
        path: '/school-admin/step/16',
        type: 'text',
        title: 'Anything Else?',
        description: 'Is there anything else about student phone use you\'d like us to know?',
    },
    {
        id: 'thank-you',
        path: '/school-admin/thank-you',
        type: 'thank-you',
        title: 'Thank You 🙏',
        description: 'Your insights will directly shape how we support schools.',
    },
];

// ── Select Options ────────────────────────────────────────

export const SCHOOL_ISSUES_OPTIONS = [
    { value: 'distracted-class', label: 'Students constantly distracted in class' },
    { value: 'cyberbullying', label: 'Cyberbullying among students' },
    { value: 'inappropriate-content', label: 'Inappropriate content accessed on campus' },
    { value: 'recording', label: 'Students recording teachers or peers without consent' },
    { value: 'cheating', label: 'Cheating using devices' },
    { value: 'mental-health', label: 'Mental health concerns linked to phone/social media use' },
    { value: 'no-socializing', label: 'Students on phones during breaks instead of socializing' },
    { value: 'parent-complaints', label: 'Parent complaints about phone-related incidents' },
    { value: 'parent-undermining', label: 'Parents undermining school phone policies' },
    { value: 'parent-pushback', label: 'Parent pushback when phones are confiscated' },
    { value: 'theft-damage', label: 'Theft or damage of expensive devices' },
    { value: 'missing-instruction', label: 'Students missing instruction due to phone use' },
    { value: 'staff-conflict', label: 'Conflict between staff and students when enforcing rules' },
    { value: 'phone-anxiety', label: 'Students visibly anxious or unable to focus without their phone' },
    { value: 'legal-liability', label: 'Legal or liability concerns (recordings, privacy, incidents)' },
];

export const SOLUTIONS_TRIED_OPTIONS = [
    { value: 'full-ban', label: 'School-wide phone ban (phones off / away all day)' },
    { value: 'class-rules', label: 'Class-by-class rules (teacher discretion)' },
    { value: 'pouches', label: 'Phone pouches (e.g., Yondr)' },
    { value: 'collection', label: 'Phone collection at door / in bins' },
    { value: 'confiscation', label: 'Confiscation policy (take phone, return end of day/week)' },
    { value: 'tech-restrictions', label: 'Technology-based restrictions (MDM, app blockers, Wi-Fi filtering)' },
    { value: 'parent-comms', label: 'Parent communication campaigns' },
    { value: 'digital-citizenship', label: 'Student education / digital citizenship programs' },
    { value: 'incentives', label: 'Incentive or reward systems for compliance' },
    { value: 'no-policy', label: 'No formal policy in place' },
];

export const BUDGET_OPTIONS = [
    { value: 'under-100', label: 'Under $100' },
    { value: '100-200', label: '$100 – $200' },
    { value: '200-300', label: '$200 – $300' },
    { value: '300-500', label: '$300 – $500' },
    { value: '500-plus', label: '$500+' },
    { value: 'parent-purchased', label: 'Would need to be parent-purchased' },
    { value: 'grant-funding', label: 'Would need grant funding or outside support' },
];

export const PILOT_INTEREST_OPTIONS = [
    { value: 'yes', label: 'Yes, definitely — I\'d want to explore this' },
    { value: 'possibly', label: 'Possibly — tell me more' },
    { value: 'keep-informed', label: 'Not right now, but keep me informed' },
    { value: 'no', label: 'No, not interested' },
];

export const POLICY_OPTIONS = [
    { value: 'full-ban', label: 'Full ban — phones must be off and away the entire school day' },
    { value: 'restricted', label: 'Restricted — phones allowed at lunch/passing periods but not in class' },
    { value: 'teacher-discretion', label: 'Teacher discretion — each teacher sets their own rules' },
    { value: 'no-policy', label: 'No formal policy — phones are generally tolerated' },
    { value: 'byod', label: 'BYOD / 1:1 program — phones are part of instruction' },
];

export const SCHOOL_TYPE_OPTIONS = [
    { value: 'public', label: 'Public' },
    { value: 'private', label: 'Private' },
    { value: 'charter', label: 'Charter' },
    { value: 'other', label: 'Other' },
];

export const GRADE_LEVEL_OPTIONS = [
    { value: 'elementary', label: 'Elementary' },
    { value: 'middle', label: 'Middle School' },
    { value: 'high', label: 'High School' },
    { value: 'k12', label: 'K–12' },
    { value: 'other', label: 'Other' },
];

export const ROLE_OPTIONS = [
    { value: 'principal', label: 'Principal' },
    { value: 'asst-principal', label: 'Assistant Principal' },
    { value: 'counselor', label: 'Counselor' },
    { value: 'it-director', label: 'IT Director' },
    { value: 'dean', label: 'Dean of Students' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'other', label: 'Other' },
];

export const CALL_INTEREST_OPTIONS = [
    { value: 'yes', label: 'Yes, happy to chat' },
    { value: 'maybe', label: 'Maybe later' },
    { value: 'no', label: 'No thanks' },
];

export const DISRUPTION_FREQUENCY_OPTIONS = [
    { value: 'multiple-daily', label: 'Multiple times per day' },
    { value: 'once-daily', label: 'About once a day' },
    { value: 'few-weekly', label: 'A few times per week' },
    { value: 'rarely', label: 'Rarely or never' },
];

export const ENFORCEMENT_SOURCE_OPTIONS = [
    { value: 'mostly-students', label: 'Mostly from students' },
    { value: 'mostly-parents', label: 'Mostly from parents' },
    { value: 'equal-mix', label: 'Equal mix of both' },
    { value: 'from-staff', label: 'More from staff/teachers reluctant to enforce' },
    { value: 'not-much', label: 'Not much resistance' },
];

export const TEACHER_CONSISTENCY_OPTIONS = [
    { value: 'very-consistent', label: 'Very consistent — all teachers enforce equally' },
    { value: 'mostly-consistent', label: 'Mostly consistent with a few exceptions' },
    { value: 'inconsistent', label: 'Inconsistent — varies significantly between teachers' },
    { value: 'no-enforcement', label: 'Most teachers have given up enforcing' },
];

export const TEACHER_SUPPORT_OPTIONS = [
    { value: 'well-supported', label: 'Well supported — admin backs them up consistently' },
    { value: 'somewhat', label: 'Somewhat — support is uneven' },
    { value: 'not-supported', label: 'Not supported — teachers feel on their own' },
    { value: 'unsure', label: 'Unsure / haven\'t assessed this' },
];

// ── Navigation Helpers ────────────────────────────────────

export function getAdminStepIndex(stepId: string): number {
    return ADMIN_STEPS.findIndex(s => s.id === stepId);
}

export function getAdminNextStep(currentStepId: string): typeof ADMIN_STEPS[number] | null {
    const currentIndex = getAdminStepIndex(currentStepId);
    if (currentIndex === -1 || currentIndex >= ADMIN_STEPS.length - 1) return null;
    return ADMIN_STEPS[currentIndex + 1];
}

export function getAdminPrevStep(currentStepId: string): typeof ADMIN_STEPS[number] | null {
    const currentIndex = getAdminStepIndex(currentStepId);
    if (currentIndex <= 0) return null;
    return ADMIN_STEPS[currentIndex - 1];
}

export function getAdminProgress(stepId: string): number {
    const index = getAdminStepIndex(stepId);
    if (index === -1) return 0;
    return Math.round((index / (ADMIN_STEPS.length - 1)) * 100);
}
