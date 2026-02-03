'use client';

interface SkipButtonProps {
    onClick: () => void;
}

export function SkipButton({ onClick }: SkipButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="text-sm text-text-muted hover:text-text-secondary transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
        >
            Skip
        </button>
    );
}
