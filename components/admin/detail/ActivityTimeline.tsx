'use client';

export interface TimelineEvent {
  type: string;
  timestamp: string;
  details: string;
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
}

const EVENT_CONFIG: Record<string, { color: string; bgColor: string; icon: string }> = {
  started: {
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/20',
    icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
  },
  voice_recorded: {
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/20',
    icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z',
  },
  completed: {
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  ai_analyzed: {
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10 border-cyan-500/20',
    icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z',
  },
  note_added: {
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/20',
    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  },
  tag_added: {
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10 border-pink-500/20',
    icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
  },
};

function formatTimestamp(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ActivityTimeline({ events }: ActivityTimelineProps) {
  if (events.length === 0) return null;

  return (
    <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6">
      <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-5">Activity Timeline</h3>

      <div className="space-y-0 relative">
        <div className="absolute left-[11px] top-3 bottom-3 w-px bg-white/5" />

        {events.map((event, i) => {
          const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.started;
          return (
            <div key={i} className="relative pl-8 pb-5 last:pb-0">
              <div className={`absolute left-0 top-0.5 w-6 h-6 rounded-lg border flex items-center justify-center ${config.bgColor}`}>
                <svg className={`w-3 h-3 ${config.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-white/70">{event.details}</p>
                <p className="text-[10px] text-white/25 font-mono mt-0.5">{formatTimestamp(event.timestamp)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
