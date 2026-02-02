export function FloatingElements() {
    return (
        <div className="floating-bg" aria-hidden="true">
            {/* Soft background blobs for depth */}
            <div className="floating-element floating-blob floating-blob-1" />
            <div className="floating-element floating-blob floating-blob-2" />

            {/* Floating chat bubbles with parent quotes */}
            <div className="floating-bubble floating-bubble-1">
                <span className="bubble-avatar">👩</span>
                <span className="bubble-text">&quot;Finally, a phone I can trust!&quot;</span>
            </div>

            <div className="floating-bubble floating-bubble-2">
                <span className="bubble-avatar">👨</span>
                <span className="bubble-text">&quot;Screen time battles are over&quot;</span>
            </div>

            <div className="floating-bubble floating-bubble-3">
                <span className="bubble-avatar">👩‍🦰</span>
                <span className="bubble-text">&quot;My kids actually talk to me now&quot;</span>
            </div>

            <div className="floating-bubble floating-bubble-4">
                <span className="bubble-avatar">🧑</span>
                <span className="bubble-text">&quot;This is exactly what we needed&quot;</span>
            </div>

            {/* Small accent dots */}
            <div className="floating-element floating-dot floating-dot-1" />
            <div className="floating-element floating-dot floating-dot-2" />
            <div className="floating-element floating-dot floating-dot-3" />
        </div>
    );
}
