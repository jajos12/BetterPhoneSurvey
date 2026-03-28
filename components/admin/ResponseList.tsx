'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getAdminSurveyViewFromResponse,
  getAdminSurveyViewLabel,
  getResponseCurrentStepTitle,
  getResponseProgressPercent,
  normalizeAdminSurveyView,
} from '@/lib/admin-survey-utils';
import BulkActionsToolbar from '@/components/admin/responses/BulkActionsToolbar';
import Pagination from '@/components/admin/responses/Pagination';
import Modal from '@/components/admin/ui/Modal';
import { useToast } from '@/components/admin/ui/Toast';
import type { AdminSurveyView, Tag } from '@/types/admin';

interface FilterState {
  page: number;
  status: string;
  search: string;
  painCheck: string;
  hasVoice: string;
  dateFrom: string;
  dateTo: string;
  tags: string;
  surveyType: AdminSurveyView;
}

interface ResponseListProps {
  responses: ResponseListRow[];
  page: number;
  totalCount: number;
  pageSize: number;
  initialFilters?: Partial<FilterState>;
}

interface ResponseListRow {
  id?: string;
  session_id: string;
  email: string | null;
  is_completed: boolean;
  current_step: string | null;
  started_at: string;
  survey_type?: string | null;
  form_data?: Record<string, unknown> | null;
}

interface BulkExportResponse {
  session_id: string;
  voice_recordings?: Array<{
    step_number: number;
    transcript?: string | null;
  }>;
}

function getSurveyBadgeClasses(view: AdminSurveyView) {
  switch (view) {
    case 'parent_condensed':
      return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    case 'parent_long':
      return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    case 'school_admin':
      return 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400';
    case 'all':
    default:
      return 'bg-white/5 border-white/10 text-white/40';
  }
}

export function ResponseList({ responses, page, totalCount, pageSize, initialFilters }: ResponseListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'ongoing'>(
    (initialFilters?.status as 'all' | 'completed' | 'ongoing') || 'all'
  );
  const [search, setSearch] = useState(initialFilters?.search || '');
  const [painCheck, setPainCheck] = useState(initialFilters?.painCheck || '');
  const [hasVoice, setHasVoice] = useState(initialFilters?.hasVoice || '');
  const [dateFrom, setDateFrom] = useState(initialFilters?.dateFrom || '');
  const [dateTo, setDateTo] = useState(initialFilters?.dateTo || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialFilters?.tags ? initialFilters.tags.split(',').filter(Boolean) : []
  );
  const [surveyType, setSurveyType] = useState<AdminSurveyView>(
    normalizeAdminSurveyView(initialFilters?.surveyType || 'all')
  );

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalPages = Math.ceil(totalCount / pageSize);
  const painCheckDisabled = surveyType !== 'all' && surveyType !== 'parent_long';
  const activeFilterCount = [painCheck, hasVoice, dateFrom, dateTo].filter(Boolean).length + selectedTags.length;

  useEffect(() => {
    if (activeFilterCount > 0) {
      setShowFilters(true);
    }
  }, [activeFilterCount]);

  useEffect(() => {
    fetch('/api/admin/tags')
      .then((response) => response.json())
      .then((data) => setAvailableTags(data.tags || []))
      .catch(() => {});
  }, []);

  const navigateWithFilters = (overrides: Partial<FilterState> = {}) => {
    const params = new URLSearchParams();
    const current: FilterState = {
      page: overrides.page ?? page,
      status: overrides.status ?? filter,
      search: overrides.search ?? search,
      painCheck: overrides.painCheck ?? painCheck,
      hasVoice: overrides.hasVoice ?? hasVoice,
      dateFrom: overrides.dateFrom ?? dateFrom,
      dateTo: overrides.dateTo ?? dateTo,
      tags: overrides.tags ?? selectedTags.join(','),
      surveyType: overrides.surveyType ?? surveyType,
    };

    if (current.page > 1) params.set('page', String(current.page));
    if (current.status !== 'all') params.set('status', current.status);
    if (current.search) params.set('search', current.search);
    if (current.painCheck) params.set('painCheck', current.painCheck);
    if (current.hasVoice) params.set('hasVoice', current.hasVoice);
    if (current.dateFrom) params.set('dateFrom', current.dateFrom);
    if (current.dateTo) params.set('dateTo', current.dateTo);
    if (current.tags) params.set('tags', current.tags);
    if (current.surveyType !== 'all') params.set('surveyType', current.surveyType);

    const queryString = params.toString();
    router.push(`/admin/responses${queryString ? `?${queryString}` : ''}`);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      navigateWithFilters({ search: value, page: 1 });
    }, 300);
  };

  const handleFilterChange = (key: string, value: string) => {
    switch (key) {
      case 'status':
        setFilter(value as 'all' | 'completed' | 'ongoing');
        navigateWithFilters({ status: value, page: 1 });
        break;
      case 'painCheck':
        setPainCheck(value);
        navigateWithFilters({ painCheck: value, page: 1 });
        break;
      case 'hasVoice':
        setHasVoice(value);
        navigateWithFilters({ hasVoice: value, page: 1 });
        break;
      case 'dateFrom':
        setDateFrom(value);
        navigateWithFilters({ dateFrom: value, page: 1 });
        break;
      case 'dateTo':
        setDateTo(value);
        navigateWithFilters({ dateTo: value, page: 1 });
        break;
      case 'surveyType': {
        const nextSurveyType = normalizeAdminSurveyView(value);
        const nextPainCheck = nextSurveyType === 'all' || nextSurveyType === 'parent_long' ? painCheck : '';

        setSurveyType(nextSurveyType);
        if (nextPainCheck !== painCheck) {
          setPainCheck('');
        }

        navigateWithFilters({
          surveyType: nextSurveyType,
          painCheck: nextPainCheck,
          page: 1,
        });
        break;
      }
      default:
        break;
    }
  };

  const handleTagToggle = (tagId: string) => {
    const updatedTags = selectedTags.includes(tagId)
      ? selectedTags.filter((tag) => tag !== tagId)
      : [...selectedTags, tagId];

    setSelectedTags(updatedTags);
    navigateWithFilters({ tags: updatedTags.join(','), page: 1 });
  };

  const clearAllFilters = () => {
    setFilter('all');
    setSearch('');
    setPainCheck('');
    setHasVoice('');
    setDateFrom('');
    setDateTo('');
    setSelectedTags([]);
    setSurveyType('all');
    router.push('/admin/responses');
  };

  const toggleSelect = (sessionId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === responses.length) {
      setSelectedIds(new Set());
      return;
    }

    setSelectedIds(new Set(responses.map((response) => response.session_id)));
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch('/api/admin/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', sessionIds: Array.from(selectedIds) }),
      });

      if (response.ok) {
        toast(`Deleted ${selectedIds.size} responses`, 'success');
        setSelectedIds(new Set());
        router.refresh();
      } else {
        toast('Failed to delete responses', 'error');
      }
    } catch {
      toast('Network error during deletion', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleBulkExport = async () => {
    try {
      const response = await fetch('/api/admin/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export', sessionIds: Array.from(selectedIds) }),
      });

      if (!response.ok) {
        toast('Export failed', 'error');
        return;
      }

      const { data } = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `responses-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast(`Exported ${selectedIds.size} responses`, 'success');
    } catch {
      toast('Export failed', 'error');
    }
  };

  const exportAllCSV = async () => {
    if (responses.length === 0) {
      return;
    }

    try {
      const sessionIds = responses.map((response) => response.session_id);
      const { data } = await fetch('/api/admin/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export', sessionIds }),
      }).then((response) => response.json());

      const transcriptsMap: Record<string, string[]> = {};
      data?.forEach((response: BulkExportResponse) => {
        if (!response.voice_recordings) {
          return;
        }

        response.voice_recordings.forEach((recording) => {
          if (!recording.transcript) {
            return;
          }

          if (!transcriptsMap[response.session_id]) {
            transcriptsMap[response.session_id] = [];
          }

          transcriptsMap[response.session_id].push(`Step ${recording.step_number}: ${recording.transcript}`);
        });
      });

      const allKeys = new Set<string>();
      responses.forEach((response) => {
        Object.keys(response.form_data || {}).forEach((key) => allKeys.add(key));
      });

      const sortedKeys = Array.from(allKeys).sort();
      const headers = ['Session ID', 'Email', 'Survey Type', 'Completed', 'Current Step', 'Started At', 'Transcripts', ...sortedKeys];

      const rows = responses.map((response) => {
        const formData = response.form_data || {};
        const transcripts = (transcriptsMap[response.session_id] || []).join(' | ');

        return [
          response.session_id,
          response.email || 'Anonymous',
          getAdminSurveyViewLabel(getAdminSurveyViewFromResponse(response)),
          response.is_completed ? 'Yes' : 'No',
          getResponseCurrentStepTitle(response),
          response.started_at,
          transcripts,
          ...sortedKeys.map((key) => {
            const value = formData[key];
            if (Array.isArray(value)) {
              return value.join('; ');
            }
            if (typeof value === 'object' && value !== null) {
              return JSON.stringify(value);
            }
            return value ?? '';
          }),
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `responses-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast('CSV exported with transcripts and all fields', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      toast('CSV export failed', 'error');
    }
  };

  const handlePageChange = (newPage: number) => {
    navigateWithFilters({ page: newPage });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 bg-[#0c0c0c] border border-white/5 p-4 rounded-2xl">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={toggleSelectAll}
              className={`w-5 h-5 rounded border transition-colors flex items-center justify-center ${
                selectedIds.size > 0 && selectedIds.size === responses.length
                  ? 'bg-blue-500 border-blue-500'
                  : selectedIds.size > 0
                  ? 'bg-blue-500/50 border-blue-500/50'
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              {selectedIds.size > 0 && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={selectedIds.size === responses.length ? 'M5 13l4 4L19 7' : 'M20 12H4'}
                  />
                </svg>
              )}
            </button>

            <div className="flex bg-white/5 p-1 rounded-xl">
              {(['all', 'completed', 'ongoing'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => handleFilterChange('status', status)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                    filter === status ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="flex bg-white/5 p-1 rounded-xl flex-wrap">
              {[
                { id: 'all', label: 'All Surveys' },
                { id: 'parent_condensed', label: 'Parent Condensed' },
                { id: 'parent_long', label: 'Parent Long-Form' },
                { id: 'school_admin', label: 'School Admin' },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleFilterChange('surveyType', option.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                    surveyType === option.id
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search email or session ID..."
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                data-search-input
                className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>

            <button
              onClick={() => setShowFilters((current) => !current)}
              className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-colors ${
                showFilters ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/5 text-white/40 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <button
              onClick={exportAllCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/90 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              CSV
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="border-t border-white/5 pt-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest block mb-1.5">
                  Pain Check
                </label>
                <select
                  value={painCheck}
                  disabled={painCheckDisabled}
                  onChange={(event) => handleFilterChange('painCheck', event.target.value)}
                  className={`w-full bg-white/5 border border-white/5 rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none focus:border-white/20 ${
                    painCheckDisabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="">All</option>
                  <option value="crisis">Crisis</option>
                  <option value="yes">Yes</option>
                  <option value="sometimes">Sometimes</option>
                </select>
                <p className="text-[9px] text-white/20 mt-1">Long-form parent only</p>
              </div>
              <div>
                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest block mb-1.5">
                  Has Voice
                </label>
                <select
                  value={hasVoice}
                  onChange={(event) => handleFilterChange('hasVoice', event.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none focus:border-white/20"
                >
                  <option value="">All</option>
                  <option value="yes">With Recordings</option>
                  <option value="no">Without Recordings</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest block mb-1.5">
                  Date From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => handleFilterChange('dateFrom', event.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none focus:border-white/20"
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest block mb-1.5">
                  Date To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => handleFilterChange('dateTo', event.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-lg py-1.5 px-2 text-xs text-white focus:outline-none focus:border-white/20"
                />
              </div>
            </div>

            {availableTags.length > 0 && (
              <div>
                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest block mb-1.5">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => {
                    const isActive = selectedTags.includes(tag.id);

                    return (
                      <button
                        key={tag.id}
                        onClick={() => handleTagToggle(tag.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
                          isActive ? 'border-opacity-40 opacity-100' : 'border-opacity-20 opacity-50 hover:opacity-80'
                        }`}
                        style={{
                          backgroundColor: `${tag.color}${isActive ? '25' : '10'}`,
                          borderColor: `${tag.color}${isActive ? '60' : '30'}`,
                          color: tag.color,
                        }}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeFilterCount > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-white/30 font-medium">
          Showing {responses.length} of {totalCount} responses
          {selectedIds.size > 0 && ` (${selectedIds.size} selected)`}
        </p>
        {activeFilterCount > 0 && (
          <p className="text-xs text-blue-400/60 font-medium">
            {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
          </p>
        )}
      </div>

      <div className="grid gap-3">
        {responses.length === 0 ? (
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
          responses.map((response) => {
            const isSelected = selectedIds.has(response.session_id);
            const responseView = getAdminSurveyViewFromResponse(response);
            const surveyLabel = getAdminSurveyViewLabel(responseView);
            const progressPercent = getResponseProgressPercent(response);
            const currentStepLabel = getResponseCurrentStepTitle(response);

            return (
              <div
                key={response.session_id}
                className={`flex flex-col md:flex-row md:items-center justify-between p-5 bg-[#0c0c0c] border rounded-2xl hover:bg-[#111111] transition-all group ${
                  isSelected ? 'border-blue-500/30 bg-blue-500/5' : 'border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                  <button
                    onClick={(event) => {
                      event.preventDefault();
                      toggleSelect(response.session_id);
                    }}
                    className={`w-5 h-5 rounded border transition-colors flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-blue-500 border-blue-500' : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <Link href={`/admin/responses/${response.session_id}`} className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
                        response.is_completed
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:border-emerald-500/40'
                          : 'bg-orange-500/10 border-orange-500/20 text-orange-400 group-hover:border-orange-500/40'
                      }`}
                    >
                      <span className="text-lg font-black">{response.email ? response.email[0].toUpperCase() : '?'}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-white font-bold group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                          {response.email || 'Anonymous Collector'}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-wider ${getSurveyBadgeClasses(
                            responseView
                          )}`}
                        >
                          {surveyLabel}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/40 font-mono tracking-wider uppercase">
                        ID: {response.session_id.split('-')[0]}...
                      </p>
                    </div>
                  </Link>
                </div>

                <Link href={`/admin/responses/${response.session_id}`} className="flex flex-wrap items-center gap-6">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Step progression</p>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                        <div
                          className={`h-full rounded-full ${response.is_completed ? 'bg-emerald-500' : 'bg-orange-500'}`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-white/50">{currentStepLabel}</span>
                    </div>
                  </div>

                  <div className="space-y-1 hidden sm:block">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Timestamp</p>
                    <p className="text-[10px] font-mono text-white/70 tracking-tighter">
                      {new Date(response.started_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <div
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase border ${
                      response.is_completed
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                    }`}
                  >
                    {response.is_completed ? 'COMPLETE' : 'ONGOING'}
                  </div>
                </Link>
              </div>
            );
          })
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />

      <BulkActionsToolbar
        selectedCount={selectedIds.size}
        onDelete={() => setShowDeleteModal(true)}
        onExport={handleBulkExport}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Selected Responses"
        description={`This will permanently delete ${selectedIds.size} response(s) and all associated voice recordings. This action cannot be undone.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete Forever'}
        confirmVariant="danger"
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}
