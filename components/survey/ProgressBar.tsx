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
        if (currentStepId === 'email') return 'Almost finished!';
        if (currentStepId === 'thank-you') return '✨ Thank you!';

        const mainStepCount = 12; // Update this as steps grow
        if (currentIndex > 0 && currentIndex <= mainStepCount) {
            const remaining = mainStepCount - currentIndex;
            if (remaining <= 2) return `Almost there! Step ${currentStepId} of ${mainStepCount}`;
            if (remaining <= 6) return `Great progress! Step ${currentStepId} of ${mainStepCount}`;
            return `Step ${currentStepId} of ${mainStepCount}`;
        }
        return 'Your journey begins...';
    };

    return (
        <div className="glass-card !p-4 !rounded-2xl mb-6 animate-fade-in shadow-sm">
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
                {[...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i < currentIndex
                                ? 'bg-primary scale-100'
                                : i === currentIndex - 1
                                    ? 'bg-primary-light scale-125 shadow-[0_0_8px_rgba(25,118,210,0.3)]'
                                    : 'bg-gray-200 scale-75'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
