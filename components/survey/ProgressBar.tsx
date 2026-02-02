'use client';

import { getProgress, STEPS } from '@/config/steps';

interface ProgressBarProps {
    currentStepId: string;
}

export function ProgressBar({ currentStepId }: ProgressBarProps) {
    const progress = getProgress(currentStepId);
    const currentIndex = STEPS.findIndex(s => s.id === currentStepId);

    let statusText = 'Getting started...';
    if (currentStepId === 'pain-check') {
        statusText = 'Quick check';
    } else if (currentStepId === 'email') {
        statusText = 'Almost done!';
    } else if (currentStepId === 'thank-you') {
        statusText = 'Complete!';
    } else if (currentIndex > 0 && currentIndex <= 10) {
        statusText = `Step ${currentStepId} of 10`;
    }

    return (
        <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg p-4 rounded-2xl shadow-md mb-6">
            <div className="h-2 bg-primary/15 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <p className="text-center text-sm text-text-secondary mt-2">
                {statusText}
            </p>
        </div>
    );
}
