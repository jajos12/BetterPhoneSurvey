'use client';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onDelete: () => void;
  onExport: () => void;
  onClearSelection: () => void;
}

export default function BulkActionsToolbar({ selectedCount, onDelete, onExport, onClearSelection }: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-[#111111] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl">
      <span className="text-xs font-bold text-white/60 mr-2">
        {selectedCount} selected
      </span>

      <button
        onClick={onExport}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-blue-500/20 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export
      </button>

      <button
        onClick={onDelete}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-red-500/20 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete
      </button>

      <button
        onClick={onClearSelection}
        className="px-3 py-1.5 text-white/30 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors"
      >
        Clear
      </button>
    </div>
  );
}
