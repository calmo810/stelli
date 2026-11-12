import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, RefreshCw, Sparkles } from 'lucide-react';

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
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-[22px] bg-fill" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="admin-surface flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div>
          <p className="admin-kicker st-kicker"><MessageCircle className="h-3 w-3" aria-hidden="true" /> Client signal</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-fg">FAQ conversations</h2>
          <p className="mt-2 text-[13px] text-fg-3">See what clients ask, and spot gaps in the concierge’s answers.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-line bg-[var(--field)] px-3 py-2 text-[11px] text-fg-3">{rows.length} questions</span>
          <span className="rounded-full border border-line bg-[var(--field)] px-3 py-2 text-[11px] text-fg-3">{visitors} visitors</span>
          {missed > 0 && <span className="rounded-full border border-[var(--chip-magenta-fg)] bg-[var(--chip-magenta-bg)] px-3 py-2 text-[11px] text-danger">{missed} need attention</span>}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-2xl border border-line bg-fill p-1.5">
          {[
            ['all', 'All questions'],
            ['missed', 'Needs attention'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={'rounded-xl px-3.5 py-2 text-[11px] font-semibold transition ' + (
                filter === value ? 'bg-neon-lime text-ink' : 'text-fg-3 hover:bg-fill-2 hover:text-fg'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-xl border border-line px-3.5 py-2.5 text-[11px] font-semibold text-fg-2 transition hover:border-line-2 hover:bg-fill-2 hover:text-fg"
        >
          <RefreshCw className={'h-3.5 w-3.5 ' + (isFetching ? 'animate-spin' : '')} aria-hidden="true" />
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {shown.length === 0 ? (
        <div className="admin-surface p-12 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-fill-2 text-accent2"><Sparkles className="h-5 w-5" aria-hidden="true" /></span>
          <p className="mt-4 text-[13px] text-fg-3">
            {filter === 'missed' ? 'Nothing needs attention right now.' : 'No one has asked the FAQ phone a question yet.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((row) => (
            <li key={row.id} className="admin-surface p-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 st-kicker text-fg-3">
                <span>{when(row.created_date)}</span>
                <span>Visitor {String(row.session_id || '').slice(0, 6)}</span>
                <span>{row.signed_in ? 'Signed in' : 'Guest'}</span>
                {row.source === 'fallback' && <span className="rounded-full bg-[var(--chip-magenta-bg)] px-2 py-1 text-danger">Needs FAQ answer</span>}
              </div>
              <p className="mt-4 text-[18px] font-semibold text-fg">“{row.question}”</p>
              {row.answer && <p className="mt-3 max-w-4xl whitespace-pre-line text-[13px] leading-relaxed text-fg-2">{row.answer}</p>}
              {row.links?.length > 0 && (
                <p className="mt-4 text-[12px] text-accent2">Linked: {row.links.join(', ')}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
