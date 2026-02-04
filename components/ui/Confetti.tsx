'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export function Confetti() {
    useEffect(() => {
        // Fire confetti from multiple angles
        const duration = 2000;
        const end = Date.now() + duration;

        const colors = ['#22C55E', '#4ADE80', '#FFD700', '#FF6B4A', '#A78BFA', '#60A5FA'];

        const frame = () => {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.7 },
                colors: colors
            });

            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.7 },
                colors: colors
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };

        // Initial burst
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: colors
        });

        // Continuous from sides
        frame();

        return () => {
            confetti.reset();
        };
    }, []);

    return null;
}
