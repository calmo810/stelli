import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

// The admin page's card look (see AdminDashboard.jsx).
const SURFACE = {
  background: 'linear-gradient(145deg, hsl(var(--surface-2) / .86), hsl(var(--surface) / .94))',
  borderRadius: 22,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08), 0 18px 42px -30px rgba(0,0,0,.78)',
};

const OUTCOME_TONE = { ok: 'lime', refused: 'cyan', failed: 'magenta' };

function when(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * The record of what founders have done here: who, what, which booking or
 * creator, how much, and how it ended. Written by the backend, read-only here.
 */
export default function AdminActivity() {
  const { data: entries = [], isLoading, isError } = useQuery({
    queryKey: ['admin-audit-log'],
    queryFn: () => base44.entities.AdminAuditLog.list('-at', 200),
  });

  if (isLoading) {
    return (
      <div className="space-y-2" aria-label="Loading activity">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded border border-white/10 bg-white/[0.03]" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p role="alert" className="border border-neon-magenta/30 p-4 font-body text-[13px] text-white/70">
        The activity log could not be loaded. Refresh the page and try again.
      </p>
    );
  }

  if (!entries.length) {
    return (
      <p className="py-20 text-center font-body text-[13px] text-white/45">
        Nothing yet. Releases, refunds, payouts and creator decisions made here are listed as they happen.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {entries.map((entry) => {
        const tone = OUTCOME_TONE[entry.outcome] || 'cyan';
        return (
          <li key={entry.id} className="border border-white/10 p-4" style={SURFACE}>
            <p className="font-body text-[14px] leading-relaxed text-white/85">{entry.summary || entry.action}</p>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 label-mono text-[9px] text-white/40">
              <span>{when(entry.at)}</span>
              <span>{entry.actor_email || 'system'}</span>
              <span>{String(entry.action || '').replace(/_/g, ' ')}</span>
              {Number(entry.amount) > 0 && <span>${Number(entry.amount).toFixed(2)}</span>}
              <span style={{ color: `hsl(var(--neon-${tone}))` }}>{entry.outcome || 'ok'}</span>
            </p>
          </li>
        );
      })}
    </ul>
  );
}
