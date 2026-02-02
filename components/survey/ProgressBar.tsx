'use client';

import { getProgress, STEPS } from '@/config/steps';

interface ProgressBarProps {
    currentStepId: string;
}

export function ProgressBar({ currentStepId }: ProgressBarProps) {
    const progress = getProgress(currentStepId);
    const currentIndex = STEPS.findIndex(s => s.id === currentStepId);

    // Warm, encouraging status messages
    const getStatusMessage = () => {
        if (currentStepId === 'pain-check') return 'Just a quick check...';
        if (currentStepId === 'email') return 'One last thing...';
        if (currentStepId === 'thank-you') return '✨ Thank you!';
        if (currentIndex > 0 && currentIndex <= 10) {
            const remaining = 10 - currentIndex;
            if (remaining <= 2) return `Almost there! Step ${currentStepId} of 10`;
            if (remaining <= 5) return `Halfway through! Step ${currentStepId} of 10`;
            return `Step ${currentStepId} of 10`;
        }
        return 'Your journey begins...';
    };

    return (
        <div className="glass-card !p-4 !rounded-2xl mb-6 animate-fade-in">
            {/* Progress track */}
            <div className="progress-track">
                <div
                    className="progress-fill"
                    style={{ width: `${Math.max(progress, 5)}%` }}
                />
            </div>

            {/* Status text */}
            <p className="text-center text-sm text-text-secondary mt-3 font-medium">
                {getStatusMessage()}
            </p>

            {/* Step indicators */}
            <div className="flex justify-between mt-3 px-1">
                {[...Array(10)].map((_, i) => (
                    <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${i < currentIndex
                                ? 'bg-primary scale-100'
                                : i === currentIndex - 1
                                    ? 'bg-primary-light scale-125'
                                    : 'bg-text-light scale-75'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
