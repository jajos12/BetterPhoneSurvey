'use client';

import { useEffect } from 'react';

interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const shortcuts = [
  { category: 'Navigation', items: [
    { keys: ['g', 'd'], description: 'Go to Dashboard' },
    { keys: ['g', 'r'], description: 'Go to Responses' },
    { keys: ['g', 'i'], description: 'Go to Insights' },
    { keys: ['g', 'c'], description: 'Go to Compare' },
  ]},
  { category: 'Actions', items: [
    { keys: ['/'], description: 'Focus search' },
    { keys: ['Esc'], description: 'Close / Blur' },
    { keys: ['?'], description: 'Toggle this help' },
  ]},
];

export default function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Keyboard Shortcuts</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {shortcuts.map((group) => (
            <div key={group.category}>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-3">{group.category}</p>
              <div className="space-y-2">
                {group.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5">
                    <span className="text-xs text-white/60 font-medium">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, ki) => (
                        <span key={ki}>
                          {ki > 0 && <span className="text-white/20 text-xs mx-0.5">+</span>}
                          <kbd className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[10px] font-mono text-white/50 font-bold min-w-[24px] text-center inline-block">
                            {key}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-white/5">
          <p className="text-[10px] text-white/20 text-center font-medium">
            Press <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-mono">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
