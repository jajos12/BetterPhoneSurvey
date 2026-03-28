export const CONDENSED_STORAGE_KEY = 'betterphone_condensed_survey_data';
export const CONDENSED_SESSION_KEY = 'betterphone_condensed_session_id';
export const CONDENSED_SESSION_PREFIX = 'condensed_';
export const CONDENSED_VARIANT = 'condensed_v6';

export const CONDENSED_ISSUES_OPTIONS = [
    { value: 'addiction', label: 'Phone/screen addiction' },
    { value: 'inappropriate', label: 'Inappropriate content' },
    { value: 'focus', label: 'Difficulty focusing' },
    { value: 'mood', label: 'Mood / irritability' },
    { value: 'gaming', label: 'Excessive gaming' },
    { value: 'cyberbullying', label: 'Cyberbullying' },
    { value: 'sleep', label: 'Sleep problems' },
    { value: 'social-media', label: 'Social media issues' },
];

export const CONDENSED_PRICE_OPTIONS = [
    { value: 'under-250', label: 'Under $250' },
    { value: '250-500', label: '$250 - $500' },
    { value: '500-750', label: '$500 - $750' },
    { value: '750-1000', label: '$750 - $1,000' },
    { value: '1000-plus', label: '$1,000+' },
];

export const CONDENSED_STEPS = [
    {
        id: '1',
        path: '/step/1',
        title: "Tell us what's going on",
        description: 'What worries you most about your kid and screens - and what have you tried?',
    },
    {
        id: '2',
        path: '/step/2',
        title: 'A few quick taps',
        description: 'Check any issues your family has experienced:',
    },
    {
        id: 'thank-you',
        path: '/thank-you',
        title: 'Thank you!',
        description: 'Your experience is shaping what we build next.',
    },
] as const;

export function getCondensedStep(stepId: string) {
    return CONDENSED_STEPS.find((step) => step.id === stepId) ?? null;
}

export function getCondensedNextStep(stepId: string) {
    const index = CONDENSED_STEPS.findIndex((step) => step.id === stepId);
    if (index === -1 || index >= CONDENSED_STEPS.length - 1) {
        return null;
    }
    return CONDENSED_STEPS[index + 1];
}

export function getCondensedPrevStep(stepId: string) {
    const index = CONDENSED_STEPS.findIndex((step) => step.id === stepId);
    if (index <= 0) {
        return null;
    }
    return CONDENSED_STEPS[index - 1];
}

export function getCondensedProgress(stepId: string) {
    const visibleSteps = CONDENSED_STEPS.filter((step) => step.id !== 'thank-you');
    const index = visibleSteps.findIndex((step) => step.id === stepId);
    if (index === -1) {
        return 0;
    }
    return Math.round(((index + 1) / visibleSteps.length) * 100);
}
