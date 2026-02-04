'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ResponseListProps {
    responses: any[];
}

export function ResponseList({ responses }: ResponseListProps) {
    const [filter, setFilter] = useState<'all' | 'completed' | 'ongoing'>('all');
    const [search, setSearch] = useState('');

    const filtered = responses.filter(r => {
        const matchesFilter =
            filter === 'all' ? true :
                filter === 'completed' ? r.is_completed :
                    !r.is_completed;

        const matchesSearch =
            (r.email || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.session_id || '').toLowerCase().includes(search.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    const exportToCSV = () => {
        if (responses.length === 0) return;

        const headers = ['Session ID', 'Email', 'Completed', 'Current Step', 'Started At'];
        const rows = responses.map(r => [
            r.session_id,
            r.email || 'Anonymous',
            r.is_completed ? 'Yes' : 'No',
            r.current_step,
            r.started_at
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `responses-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#0c0c0c] border border-white/5 p-4 rounded-2xl">
                <div className="flex bg-white/5 p-1 rounded-xl">
                    {(['all', 'completed', 'ongoing'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${filter === f
                                ? 'bg-white text-black shadow-lg shadow-white/5'
                                : 'text-white/40 hover:text-white/60'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search responses..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
                        />
                    </div>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/90 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="grid gap-4">
                {filtered.length === 0 ? (
                    <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-20 text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                            <svg className="w-8 h-8 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1">No matches found</h3>
                        <p className="text-white/20 text-sm font-medium">Try adjusting your filters or search terms</p>
                    </div>
                ) : (
                    filtered.map((res) => (
                        <Link
                            key={res.session_id}
                            href={`/admin/responses/${res.session_id}`}
                            className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-[#0c0c0c] border border-white/5 rounded-2xl hover:bg-[#111111] hover:border-white/20 transition-all group"
                        >
                            <div className="flex items-center gap-4 mb-4 md:mb-0">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${res.is_completed
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:border-emerald-500/40'
                                    : 'bg-orange-500/10 border-orange-500/20 text-orange-400 group-hover:border-orange-500/40'
                                    }`}>
                                    <span className="text-lg font-black">{res.email ? res.email[0].toUpperCase() : '?'}</span>
                                </div>
                                <div>
                                    <h4 className="text-white font-bold group-hover:text-blue-400 transition-colors uppercase tracking-tight">{res.email || 'Anonymous Collector'}</h4>
                                    <p className="text-[10px] text-white/40 font-mono tracking-wider uppercase">ID: {res.session_id.split('-')[0]}...</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-6">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Step progression</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                                            <div
                                                className={`h-full rounded-full ${res.is_completed ? 'bg-emerald-500' : 'bg-orange-500'}`}
                                                style={{ width: `${(parseInt(res.current_step) / 12) * 100 || 5}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-mono text-white/50">S{res.current_step || '0'}</span>
                                    </div>
                                </div>

                                <div className="space-y-1 hidden sm:block">
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Timestamp</p>
                                    <p className="text-[10px] font-mono text-white/70 tracking-tighter">
                                        {new Date(res.started_at).toLocaleString([], {
                                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </p>
                                </div>

                                <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase border ${res.is_completed
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                    : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                                    }`}>
                                    {res.is_completed ? 'COMPLETE' : 'ONGOING'}
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
