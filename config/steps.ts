// Step configuration for the survey
import type { StepConfig } from '@/types/survey';

export const STEPS: StepConfig[] = [
    {
        id: 'pain-check',
        path: '/survey/pain-check',
        type: 'gate',
        title: 'Before we continue...',
        description: "We need to make sure this survey is right for you.",
    },
    {
        id: '1',
        path: '/survey/step/1',
        type: 'voice',
        title: "Tell us what's going on",
        description: "What is the most challenging aspect of your child's relationship with screens or technology?",
        hasVoice: true,
    },
    {
        id: '2',
        path: '/survey/step/2',
        type: 'checkbox',
        title: 'Have you experienced any of these issues?',
        description: 'Select all that apply to your family.',
    },
    {
        id: '3',
        path: '/survey/step/3',
        type: 'ranking',
        title: 'Rank your pain points',
        description: 'Drag to reorder these from most painful (top) to least painful (bottom).',
    },
    {
        id: '4',
        path: '/survey/step/4',
        type: 'voice',
        title: 'Tell us more about why these are painful',
        description: 'Can you elaborate on why those were the most painful problems? How urgent is solving them?',
        hasVoice: true,
    },
    {
        id: '5',
        path: '/survey/step/5',
        type: 'voice',
        title: 'What have you tried?',
        description: "Tell us what solutions you've tried, what happened, and how much you've spent.",
        hasVoice: true,
    },
    {
        id: '6',
        path: '/survey/step/6',
        type: 'voice',
        title: 'Switching Concerns & Motivation',
        description: 'What would make switching hard? And what would make you willing to switch TODAY?',
        hasVoice: true,
    },
    {
        id: '7',
        path: '/survey/step/7',
        type: 'checkbox',
        title: "What would you hope your child's phone provides?",
        description: 'Select the benefits that matter most to you.',
    },
    {
        id: '8',
        path: '/survey/step/8',
        type: 'form',
        title: 'Tell us about your family',
        description: "Help us understand your family's situation.",
        hasVoice: true,
    },
    {
        id: '9',
        path: '/survey/step/9',
        type: 'checkbox',
        title: 'Where do you look for parenting advice?',
        description: 'Select all the places where you look for advice online.',
    },
    {
        id: '10',
        path: '/survey/step/10',
        type: 'checkbox',
        title: 'Price Willingness',
        description: 'Select all the price ranges you would be willing to pay if this phone solved your child’s device problems.',
    },
    {
        id: '11',
        path: '/survey/step/11',
        type: 'text',
        title: 'Why did you click?',
        description: 'Was there anything that made you almost not click?',
    },
    {
        id: '12',
        path: '/survey/step/12',
        type: 'text',
        title: 'Anything else?',
        description: "Is there anything else you'd like us to know?",
    },
    {
        id: 'email',
        path: '/survey/email',
        type: 'email',
        title: 'Stay connected',
        description: "We'd love to keep you updated on our progress.",
    },
    {
        id: 'thank-you',
        path: '/survey/thank-you',
        type: 'thank-you',
        title: 'Thank you 🙏',
        description: "Your answers will directly shape what we build.",
    },
];

export const ISSUES_OPTIONS = [
    { value: 'addiction', label: 'Phone/screen addiction' },
    { value: 'sleep', label: 'Sleep problems from screen use' },
    { value: 'focus', label: 'Difficulty focusing' },
    { value: 'mood', label: 'Mood changes or irritability' },
    { value: 'social-media', label: 'Social media issues' },
    { value: 'gaming', label: 'Excessive gaming' },
    { value: 'inappropriate', label: 'Access to inappropriate content' },
    { value: 'cyberbullying', label: 'Cyberbullying' },
    { value: 'homework', label: 'Not doing homework' },
    { value: 'family-time', label: 'Less family time' },
    { value: 'outdoor', label: 'Less outdoor activity' },
];

export const BENEFITS_OPTIONS = [
    { value: 'safety', label: 'Safety and location tracking' },
    { value: 'communication', label: 'Easy communication with family' },
    { value: 'limited-apps', label: 'Limited app access' },
    { value: 'screen-time', label: 'Built-in screen time limits' },
    { value: 'educational', label: 'Educational content only' },
    { value: 'no-social', label: 'No social media' },
    { value: 'parental-control', label: 'Strong parental controls' },
    { value: 'durable', label: 'Durable design for kids' },
];

export const ADVICE_SOURCES_OPTIONS = [
    { value: 'facebook', label: 'Facebook Groups' },
    { value: 'reddit', label: 'Reddit (r/parenting, etc.)' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'pediatrician', label: 'Pediatrician' },
    { value: 'friends', label: 'Friends/Family' },
    { value: 'blogs', label: 'Parenting Blogs' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'other', label: 'Other' },
];

export const PRICE_WILLINGNESS_OPTIONS = [
    { value: '1000-plus', label: '$1,000+' },
    { value: '750-1000', label: '$750 - $1,000' },
    { value: '500-750', label: '$500 - $750' },
    { value: '250-500', label: '$250 - $500' },
    { value: 'under-250', label: '$250 or below' },
];

export const INCOME_OPTIONS = [
    { value: 'under-50k', label: 'Under $50k' },
    { value: '50k-100k', label: '$50k - $100k' },
    { value: '100k-150k', label: '$100k - $150k' },
    { value: '150k-250k', label: '$150k - $250k' },
    { value: '250k-plus', label: '$250k+' },
];

export function getStepIndex(stepId: string): number {
    return STEPS.findIndex(s => s.id === stepId);
}

export function getNextStep(currentStepId: string): StepConfig | null {
    const currentIndex = getStepIndex(currentStepId);
    if (currentIndex === -1 || currentIndex >= STEPS.length - 1) return null;
    return STEPS[currentIndex + 1];
}

export function getPrevStep(currentStepId: string): StepConfig | null {
    const currentIndex = getStepIndex(currentStepId);
    if (currentIndex <= 0) return null;
    return STEPS[currentIndex - 1];
}

export function getProgress(stepId: string): number {
    const index = getStepIndex(stepId);
    if (index === -1) return 0;
    return Math.round((index / (STEPS.length - 1)) * 100);
}
