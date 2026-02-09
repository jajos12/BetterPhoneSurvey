'use client';

import { useState, useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useRouter } from 'next/navigation';

export function useAdminShortcuts() {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);

  // Navigation shortcuts (g+key sequences)
  useHotkeys('g+d', () => router.push('/admin'), { preventDefault: true });
  useHotkeys('g+r', () => router.push('/admin/responses'), { preventDefault: true });
  useHotkeys('g+i', () => router.push('/admin/insights'), { preventDefault: true });
  useHotkeys('g+c', () => router.push('/admin/compare'), { preventDefault: true });

  // Focus search
  useHotkeys('/', (e) => {
    e.preventDefault();
    const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
    if (searchInput) searchInput.focus();
  });

  // Blur / close
  useHotkeys('escape', () => {
    (document.activeElement as HTMLElement)?.blur();
    setShowHelp(false);
  });

  // Help modal (Shift+/)
  useHotkeys('shift+/', (e) => {
    e.preventDefault();
    setShowHelp(prev => !prev);
  });

  const closeHelp = useCallback(() => setShowHelp(false), []);

  return { showHelp, closeHelp };
}
