'use client';

import { useState, useEffect } from 'react';
import type { Tag } from '@/types/admin';

interface TagManagerProps {
  responseId: string;
  assignedTags: Tag[];
}

export default function TagManager({ responseId, assignedTags: initialTags }: TagManagerProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [assignedTags, setAssignedTags] = useState<Tag[]>(initialTags);
  const [showDropdown, setShowDropdown] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  useEffect(() => {
    fetch('/api/admin/tags')
      .then(r => r.json())
      .then(d => setAllTags(d.tags || []))
      .catch(() => {});
  }, []);

  const assignTag = async (tag: Tag) => {
    if (assignedTags.find(t => t.id === tag.id)) return;
    try {
      const res = await fetch('/api/admin/tags/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseId, tagId: tag.id }),
      });
      if (res.ok) {
        setAssignedTags(prev => [...prev, tag]);
      }
    } catch {}
    setShowDropdown(false);
  };

  const unassignTag = async (tagId: string) => {
    try {
      const res = await fetch('/api/admin/tags/assign', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseId, tagId }),
      });
      if (res.ok) {
        setAssignedTags(prev => prev.filter(t => t.id !== tagId));
      }
    } catch {}
  };

  const createAndAssign = async () => {
    if (!newTagName.trim()) return;
    try {
      const res = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim() }),
      });
      if (res.ok) {
        const { tag } = await res.json();
        setAllTags(prev => [...prev, tag]);
        await assignTag(tag);
        setNewTagName('');
      }
    } catch {}
  };

  const unassignedTags = allTags.filter(t => !assignedTags.find(a => a.id === t.id));

  return (
    <div>
      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Tags</p>
      <div className="flex flex-wrap gap-1.5 items-center">
        {assignedTags.map(tag => (
          <span
            key={tag.id}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border"
            style={{
              backgroundColor: `${tag.color}15`,
              borderColor: `${tag.color}30`,
              color: tag.color,
            }}
          >
            {tag.name}
            <button onClick={() => unassignTag(tag.id)} className="hover:opacity-70 ml-0.5">&times;</button>
          </span>
        ))}

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors text-sm"
          >
            +
          </button>
          {showDropdown && (
            <div className="absolute top-8 left-0 z-50 bg-[#111111] border border-white/10 rounded-xl shadow-2xl p-2 min-w-[180px]">
              {unassignedTags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => assignTag(tag)}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-white/60 hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                  {tag.name}
                </button>
              ))}
              <div className="border-t border-white/5 mt-1 pt-1">
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={e => setNewTagName(e.target.value)}
                    placeholder="New tag..."
                    className="flex-1 bg-white/5 border border-white/5 rounded-lg px-2 py-1 text-[10px] text-white placeholder:text-white/20 focus:outline-none"
                    onKeyDown={e => e.key === 'Enter' && createAndAssign()}
                  />
                  <button onClick={createAndAssign} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-[10px] font-bold">Add</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
