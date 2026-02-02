export function FloatingElements() {
    return (
        <div className="floating-bg" aria-hidden="true">
            {/* Large background blobs */}
            <div className="floating-element floating-blob floating-blob-1" />
            <div className="floating-element floating-blob floating-blob-2" />
            <div className="floating-element floating-blob floating-blob-3" />

            {/* Medium floating shapes */}
            <div className="floating-element floating-shape floating-shape-1" />
            <div className="floating-element floating-shape floating-shape-2" />
            <div className="floating-element floating-shape floating-shape-3" />
            <div className="floating-element floating-shape floating-shape-4" />

            {/* Small accent dots */}
            <div className="floating-element floating-dot floating-dot-1" />
            <div className="floating-element floating-dot floating-dot-2" />
            <div className="floating-element floating-dot floating-dot-3" />
            <div className="floating-element floating-dot floating-dot-4" />
        </div>
    );
}
