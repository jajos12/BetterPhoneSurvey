export type CondensedSurveyVariant = 'condensed_v6' | 'condensed_v7';

export const CONDENSED_STORAGE_KEY = 'betterphone_condensed_v7_survey_data';
export const CONDENSED_SESSION_KEY = 'betterphone_condensed_v7_session_id';
export const CONDENSED_SESSION_PREFIX = 'condensed_v7_';
export const CONDENSED_VARIANT: CondensedSurveyVariant = 'condensed_v7';
export const LEGACY_CONDENSED_VARIANTS: readonly CondensedSurveyVariant[] = ['condensed_v6'];
export const ALL_CONDENSED_VARIANTS: readonly CondensedSurveyVariant[] = [CONDENSED_VARIANT, ...LEGACY_CONDENSED_VARIANTS];

export const CONDENSED_QUALIFIER_OPTIONS = [
    { value: 'crisis', label: 'Crisis level - I need a solution immediately' },
    { value: 'yes', label: 'Yes, this is a regular source of stress' },
    { value: 'sometimes', label: 'Sometimes' },
    { value: 'no', label: 'No' },
] as const;

export const CONDENSED_ISSUES_OPTIONS = [
    { value: 'Phone/screen addiction', label: 'Phone/screen addiction' },
    { value: 'Inappropriate content', label: 'Inappropriate content' },
    { value: 'Difficulty focusing', label: 'Difficulty focusing' },
    { value: 'Mood / irritability', label: 'Mood / irritability' },
    { value: 'Excessive gaming', label: 'Excessive gaming' },
    { value: 'Cyberbullying', label: 'Cyberbullying' },
    { value: 'Sleep problems', label: 'Sleep problems' },
    { value: 'Social media issues', label: 'Social media issues' },
] as const;

export const CONDENSED_AGE_OPTIONS = [
    { value: '8-10', label: '8-10' },
    { value: '11-13', label: '11-13' },
    { value: '14-16', label: '14-16' },
    { value: '17+', label: '17+' },
] as const;

export const CONDENSED_FEATURE_OPTIONS = [
    {
        value: 'Blocks harmful content and predators at the device level',
        label: 'Blocks harmful content and predators at the device level',
    },
    {
        value: "Controls kids can't bypass or disable",
        label: "Controls kids can't bypass or disable",
    },
    {
        value: 'Kills addictive app features (infinite scroll, autoplay, short-form video)',
        label: 'Kills addictive app features (infinite scroll, autoplay, short-form video)',
    },
    { value: 'Automatic shutoff at bedtime', label: 'Automatic shutoff at bedtime' },
    { value: 'Screen time scheduling by app', label: 'Screen time scheduling by app' },
    { value: 'Location tracking', label: 'Location tracking' },
    { value: 'Safe calls and texts only', label: 'Safe calls and texts only' },
    { value: 'Manage everything from your own phone', label: 'Manage everything from your own phone' },
] as const;

export const CONDENSED_DEVICE_OPTIONS = [
    { value: 'iPhone', label: 'iPhone' },
    { value: 'Android', label: 'Android' },
    { value: 'No phone yet', label: 'No phone yet' },
    { value: 'Other', label: 'Other' },
] as const;

export const CONDENSED_PRICE_OPTIONS = [
    { value: 'Under $250', label: 'Under $250' },
    { value: '$250 - $500', label: '$250 - $500' },
    { value: '$500 - $750', label: '$500 - $750' },
    { value: '$750 - $1,000', label: '$750 - $1,000' },
    { value: '$1,000+', label: '$1,000+' },
] as const;

type CondensedStepConfig = {
    id: string;
    path: string;
    title: string;
    description: string;
    eyebrow?: string;
    progress?: number;
    displayStep?: number;
    displayStepCount?: number;
    includeInFunnel?: boolean;
};

export const CONDENSED_STEPS = [
    {
        id: 'qualifier',
        path: '/step/qualifier',
        title: 'Before we continue...',
        description: "Is your child's relationship with their phone causing you stress or concern?",
        eyebrow: 'Quick Check',
        progress: 10,
        includeInFunnel: true,
    },
    {
        id: 'no-path',
        path: '/step/no-path',
        title: 'Thanks for your time!',
        description: 'This survey is specifically for parents experiencing these challenges, but you can still help by referring another family.',
        eyebrow: 'Referral Path',
        includeInFunnel: false,
    },
    {
        id: '1',
        path: '/step/1',
        title: "Tell us what's going on",
        description: "What worries you most about your kid and screens?",
        progress: 20,
        displayStep: 1,
        displayStepCount: 4,
        includeInFunnel: true,
    },
    {
        id: '2',
        path: '/step/2',
        title: 'Quick taps',
        description: 'Check any issues your family has experienced.',
        progress: 40,
        displayStep: 2,
        displayStepCount: 4,
        includeInFunnel: true,
    },
    {
        id: '3',
        path: '/step/3',
        title: 'Features',
        description: "What would matter most in your child's phone?",
        progress: 65,
        displayStep: 3,
        displayStepCount: 4,
        includeInFunnel: true,
    },
    {
        id: '4',
        path: '/step/4',
        title: 'Last one',
        description: 'If we solved all your technology problems, what would still stop you from switching?',
        progress: 90,
        displayStep: 4,
        displayStepCount: 4,
        includeInFunnel: true,
    },
    {
        id: 'thank-you',
        path: '/step/thank-you',
        title: 'Thank you!',
        description: 'Your experience is shaping what we build next.',
        eyebrow: 'Complete',
        includeInFunnel: false,
    },
    {
        id: 'bonus',
        path: '/step/bonus',
        title: 'A few more',
        description: 'Answer a couple optional questions for another BetterPhone discount.',
        eyebrow: 'Bonus - $15 Off',
        includeInFunnel: false,
    },
] as const satisfies readonly CondensedStepConfig[];

const LEGACY_ISSUE_LABELS: Record<string, string> = {
    addiction: 'Phone/screen addiction',
    inappropriate: 'Inappropriate content',
    focus: 'Difficulty focusing',
    mood: 'Mood / irritability',
    gaming: 'Excessive gaming',
    cyberbullying: 'Cyberbullying',
    sleep: 'Sleep problems',
    'social-media': 'Social media issues',
};

const LEGACY_PRICE_LABELS: Record<string, string> = {
    'under-250': 'Under $250',
    '250-500': '$250 - $500',
    '500-750': '$500 - $750',
    '750-1000': '$750 - $1,000',
    '1000-plus': '$1,000+',
};

const ISSUE_LABELS = new Map<string, string>([
    ...CONDENSED_ISSUES_OPTIONS.map((option) => [option.value, option.label] as const),
    ...Object.entries(LEGACY_ISSUE_LABELS),
]);

const PRICE_LABELS = new Map<string, string>([
    ...CONDENSED_PRICE_OPTIONS.map((option) => [option.value, option.label] as const),
    ...Object.entries(LEGACY_PRICE_LABELS),
]);

export function getCondensedStep(stepId: string): CondensedStepConfig | null {
    return CONDENSED_STEPS.find((step) => step.id === stepId) ?? null;
}

export function getCondensedProgress(stepId: string): number {
    return getCondensedStep(stepId)?.progress ?? 0;
}

export function getCondensedIssueLabel(value: string) {
    return ISSUE_LABELS.get(value) ?? value;
}

export function getCondensedPriceLabel(value: string) {
    return PRICE_LABELS.get(value) ?? value;
}

export function isCondensedVariant(value?: string | null): value is CondensedSurveyVariant {
    return typeof value === 'string' && ALL_CONDENSED_VARIANTS.includes(value as CondensedSurveyVariant);
}
