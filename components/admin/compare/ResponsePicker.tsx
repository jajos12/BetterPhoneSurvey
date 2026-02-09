'use client';

import { useState, useRef, useEffect } from 'react';

interface SelectedResponse {
  sessionId: string;
  email: string;
}

interface ResponsePickerProps {
  selected: SelectedResponse[];
  onAdd: (response: SelectedResponse) => void;
  onRemove: (sessionId: string) => void;
  maxSelections: number;
}

export default function ResponsePicker({ selected, onAdd, onRemove, maxSelections }: ResponsePickerProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (value.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/admin/responses?search=${encodeURIComponent(value)}&pageSize=6&page=1`);
        if (res.ok) {
          const data = await res.json();
          // Filter out already selected
          const selectedIds = new Set(selected.map(s => s.sessionId));
          setResults((data.data || []).filter((r: any) => !selectedIds.has(r.session_id)));
          setShowDropdown(true);
        }
      } catch {
        // Silent
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSelect = (response: any) => {
    onAdd({
      sessionId: response.session_id,
      email: response.email || 'Anonymous',
    });
    setSearch('');
    setResults([]);
    setShowDropdown(false);
  };

  return (
    <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Select Responses to Compare ({selected.length}/{maxSelections})</span>
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((s, i) => (
            <div
              key={s.sessionId}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl"
            >
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-black ${
                i === 0 ? 'bg-blue-500/30 text-blue-300' :
                i === 1 ? 'bg-purple-500/30 text-purple-300' :
                'bg-emerald-500/30 text-emerald-300'
              }`}>
                {i + 1}
              </div>
              <span className="text-xs font-bold text-white">{s.email}</span>
              <span className="text-[9px] text-white/30 font-mono">{s.sessionId.slice(0, 8)}...</span>
              <button
                onClick={() => onRemove(s.sessionId)}
                className="text-white/30 hover:text-red-400 transition-colors ml-1"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      {selected.length < maxSelections && (
        <div className="relative" ref={dropdownRef}>
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by email or session ID..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="w-4 h-4 text-white/30 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}

          {/* Dropdown */}
          {showDropdown && results.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-[#111111] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
              {results.map((r: any) => (
                <button
                  key={r.session_id}
                  onClick={() => handleSelect(r)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                    r.is_completed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'
                  }`}>
                    {(r.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{r.email || 'Anonymous'}</p>
                    <p className="text-[10px] text-white/30 font-mono">{r.session_id.slice(0, 12)}...</p>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-wider ${
                    r.is_completed ? 'text-emerald-400' : 'text-orange-400'
                  }`}>
                    {r.is_completed ? 'Complete' : 'Ongoing'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
