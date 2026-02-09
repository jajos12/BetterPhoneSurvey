'use client';

import { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  onConfirm?: () => void;
  children?: React.ReactNode;
}

export default function Modal({ open, onClose, title, description, confirmLabel, confirmVariant = 'primary', onConfirm, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  const confirmColors = confirmVariant === 'danger'
    ? 'bg-red-500 hover:bg-red-400 text-white'
    : 'bg-blue-500 hover:bg-blue-400 text-white';

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        {description && <p className="text-sm text-white/50 mb-4">{description}</p>}
        {children}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors uppercase tracking-wider"
          >
            Cancel
          </button>
          {onConfirm && (
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors uppercase tracking-wider ${confirmColors}`}
            >
              {confirmLabel || 'Confirm'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
