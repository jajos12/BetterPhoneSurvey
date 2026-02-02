interface SkipButtonProps {
    onClick: () => void;
}

export function SkipButton({ onClick }: SkipButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="skip-link hover:underline"
        >
            Skip this question →
        </button>
    );
}
