'use client';

import { useState, useEffect } from 'react';
import type { AdminNote } from '@/types/admin';

interface NotesSectionProps {
  responseId: string;
}

export default function NotesSection({ responseId }: NotesSectionProps) {
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/notes?responseId=${responseId}`)
      .then(r => r.json())
      .then(d => setNotes(d.notes || []))
      .catch(() => {});
  }, [responseId]);

  const addNote = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseId, content: newNote.trim() }),
      });
      if (res.ok) {
        const { note } = await res.json();
        setNotes(prev => [note, ...prev]);
        setNewNote('');
      }
    } catch {}
    setSaving(false);
  };

  const deleteNote = async (noteId: string) => {
    try {
      const res = await fetch('/api/admin/notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId }),
      });
      if (res.ok) {
        setNotes(prev => prev.filter(n => n.id !== noteId));
      }
    } catch {}
  };

  return (
    <div className="bg-[#0c0c10] border border-white/5 rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Admin Notes
          {notes.length > 0 && (
            <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded-full text-white/50 font-mono">{notes.length}</span>
          )}
        </h3>
        <svg className={`w-4 h-4 text-white/30 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="p-4 pt-0 space-y-3">
          {/* Add note */}
          <div className="flex gap-2">
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="Add a note..."
              rows={2}
              className="flex-1 bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 resize-none"
            />
            <button
              onClick={addNote}
              disabled={saving || !newNote.trim()}
              className="px-3 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-[10px] font-bold uppercase self-end hover:bg-blue-500/20 transition-colors disabled:opacity-50"
            >
              {saving ? '...' : 'Add'}
            </button>
          </div>

          {/* Existing notes */}
          {notes.map(note => (
            <div key={note.id} className="bg-white/5 border border-white/5 rounded-xl p-3 group">
              <p className="text-xs text-white/70 leading-relaxed">{note.content}</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[9px] text-white/20 font-mono">
                  {new Date(note.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="text-[9px] text-red-500/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {notes.length === 0 && (
            <p className="text-[10px] text-white/20 text-center py-2">No notes yet</p>
          )}
        </div>
      )}
    </div>
  );
}
