'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { getNextStep, getPrevStep } from '@/config/steps';

interface StepNavigationProps {
    currentStepId: string;
    onNext?: () => void | Promise<void>;
    nextLabel?: string;
    isNextDisabled?: boolean;
    showBack?: boolean;
    showSkip?: boolean;
    onSkip?: () => void;
}

export function StepNavigation({
    currentStepId,
    onNext,
    nextLabel = 'Continue',
    isNextDisabled = false,
    showBack = true,
    showSkip = false,
    onSkip,
}: StepNavigationProps) {
    const router = useRouter();
    const prevStep = getPrevStep(currentStepId);
    const nextStep = getNextStep(currentStepId);

    const handleBack = () => {
        if (prevStep) {
            router.push(prevStep.path);
        }
    };

    const handleNext = async () => {
        if (onNext) {
            await onNext();
        }
        if (nextStep) {
            router.push(nextStep.path);
        }
    };

    return (
        <div className="flex gap-4 mt-auto pt-8">
            {showBack && prevStep && (
                <Button variant="secondary" onClick={handleBack}>
                    Back
                </Button>
            )}

            <div className="flex-1" />

            {showSkip && (
                <Button variant="ghost" onClick={onSkip}>
                    Skip
                </Button>
            )}

            <Button
                onClick={handleNext}
                disabled={isNextDisabled}
            >
                {nextLabel}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
            </Button>
        </div>
    );
}
