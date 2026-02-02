'use client';

import { useState } from 'react';

interface SkipButtonProps {
    onClick: () => void;
}

export function SkipButton({ onClick }: SkipButtonProps) {
    const [confirmMode, setConfirmMode] = useState(false);

    const handleClick = () => {
        if (confirmMode) {
            onClick();
            setConfirmMode(false);
        } else {
            setConfirmMode(true);
            // Reset after 3 seconds if not confirmed
            setTimeout(() => setConfirmMode(false), 3000);
        }
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`text-xs transition-all ${confirmMode
                    ? 'text-amber-600 font-medium'
                    : 'text-text-muted/60 hover:text-text-muted'
                }`}
        >
            {confirmMode ? 'Tap again to skip →' : 'skip'}
        </button>
    );
}
