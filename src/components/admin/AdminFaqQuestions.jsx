import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * What people type into the FAQ phone, newest first, with what Stelli said
 * back. Questions the AI couldn't answer ("fallback") are worth adding to the
 * FAQ or to the concierge's rules.
 */
const when = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export default function AdminFaqQuestions() {
  const [filter, setFilter] = useState('all');
  const { data: rows = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-faq-questions'],
    queryFn: () => base44.entities.FaqQuestion.list('-created_date', 300),
  });

  const shown = useMemo(() => (filter === 'missed' ? rows.filter((r) => r.source === 'fallback') : rows), [rows, filter]);
  const visitors = useMemo(() => new Set(rows.map((r) => r.session_id)).size, [rows]);
  const missed = rows.filter((r) => r.source === 'fallback').length;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full bg-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-white/55">
          {rows.length} question{rows.length === 1 ? '' : 's'} from {visitors} visitor{visitors === 1 ? '' : 's'}
          {missed > 0 && <span className="text-neon-magenta"> · {missed} the AI couldn't answer</span>}
        </p>
        <div className="flex items-center gap-2">
          {['all', 'missed'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`label-mono text-[10px] px-3 py-2 border ${
                filter === f ? 'border-neon-lime bg-neon-lime text-ink' : 'border-white/10 text-white/50 hover:text-white'
              }`}
            >
              {f === 'all' ? 'All' : 'Missed'}
            </button>
          ))}
          <button
            type="button"
            onClick={() => refetch()}
            className="label-mono text-[10px] px-3 py-2 border border-white/10 text-white/50 hover:text-white"
          >
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="border border-white/10 p-8 text-center text-sm text-white/45">
          {filter === 'missed' ? 'Nothing missed yet.' : 'No one has typed a question into the FAQ phone yet.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((r) => (
            <li key={r.id} className="border border-white/10 p-4" style={{ background: 'hsl(var(--surface))', borderRadius: 4 }}>
              <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 label-mono text-[9px] text-white/35">
                <span>{when(r.created_date)}</span>
                <span>Visitor {String(r.session_id || '').slice(0, 6)}</span>
                <span>{r.signed_in ? 'Signed in' : 'Not signed in'}</span>
                {r.source === 'fallback' && <span className="text-neon-magenta">AI missed: keyword answer shown</span>}
              </div>
              <p className="font-medium text-white">“{r.question}”</p>
              {r.answer && <p className="mt-2 whitespace-pre-line text-sm text-white/60">{r.answer}</p>}
              {r.links?.length > 0 && (
                <p className="mt-2 text-xs text-neon-cyan">Linked: {r.links.join(', ')}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
