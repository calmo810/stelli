import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import ConfirmAction from '@/components/shared/ConfirmAction';

const SURFACE = { background: 'hsl(var(--surface))', borderRadius: 4 };

const LINES = [
  ['bookings', 'bookings'],
  ['quotes', 'quotes'],
  ['messages', 'messages'],
  ['releases', 'photo releases'],
  ['photos', 'delivered photos'],
  ['contracts', 'agreements'],
];

/**
 * The one-time backfill for account-based access (REVIEW.md, D5). "Check"
 * changes nothing and shows what would be filled in; "Run it" writes it and is
 * logged below. Safe to run twice.
 */
export default function DataFixCard() {
  const queryClient = useQueryClient();
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  const run = async (dryRun) => {
    setBusy(true);
    setError('');
    try {
      const response = await base44.functions.invoke('migrateRecordOwners', { dryRun });
      setReport(response.data);
      setConfirming(false);
      if (!dryRun) queryClient.invalidateQueries({ queryKey: ['admin-audit-log'] });
    } catch (err) {
      setError(err?.response?.data?.error || 'That did not finish. Try again in a minute.');
    } finally {
      setBusy(false);
    }
  };

  const total = report ? LINES.reduce((sum, [key]) => sum + Number(report[key] || 0), 0) : 0;

  return (
    <section className="mb-6 border border-white/10 p-5" style={SURFACE} aria-labelledby="data-fix-title">
      <p className="label-mono text-[9px] text-white/40">Run once, right after the update goes live</p>
      <h2 id="data-fix-title" className="mt-2 font-heading text-[20px] font-semibold text-white">
        One-time data fix
      </h2>
      <p className="mt-2 max-w-xl font-body text-[13px] leading-relaxed text-white/65">
        Bookings, quotes, messages and agreements are now matched to people by account, not email. A few older
        records are missing the account, so their client or creator can't see them until this has run. Check first:
        it changes nothing.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => run(true)}
          disabled={busy}
          className="min-h-[44px] border border-white/15 px-4 font-body text-[14px] font-medium text-white/80 hover:bg-white/5 disabled:opacity-40"
          style={{ borderRadius: 4 }}
        >
          {busy && !confirming ? 'Checking…' : 'Check'}
        </button>
        <button
          type="button"
          onClick={() => { setError(''); setConfirming(true); }}
          disabled={busy || !report?.dryRun}
          className="min-h-[44px] px-4 font-body text-[14px] font-semibold disabled:opacity-40"
          style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}
        >
          Run it
        </button>
      </div>

      {error && !confirming && (
        <p role="alert" className="mt-3 font-body text-[13px]" style={{ color: 'hsl(var(--neon-magenta))' }}>{error}</p>
      )}

      {report && (
        <div className="mt-4 font-body text-[13px] leading-relaxed text-white/75" aria-live="polite">
          <p className="font-medium text-white">
            {report.dryRun
              ? total ? `${total} records would be filled in:` : 'Nothing to fill in. Everything already matches.'
              : `Done. ${total} records filled in:`}
          </p>
          {total > 0 && (
            <ul className="mt-1 list-disc pl-5">
              {LINES.filter(([key]) => Number(report[key]) > 0).map(([key, label]) => (
                <li key={key}>{report[key]} {label}</li>
              ))}
            </ul>
          )}
          {report.unresolved?.length > 0 && (
            <p className="mt-2 text-white/60">
              {report.unresolved.length} could not be matched to an account (the person may have deleted it):{' '}
              <span className="label-mono text-[10px]">
                {report.unresolved.map((item) => `${item.entity} ${item.id}`).join(', ')}
              </span>
            </p>
          )}
        </div>
      )}

      <ConfirmAction
        open={confirming}
        title="Fill in the missing accounts?"
        message={`This writes the account IDs the check found to ${total} records. It changes nothing else, and it's logged below.`}
        confirmLabel="Run it"
        busy={busy}
        error={error}
        onConfirm={() => run(false)}
        onCancel={() => setConfirming(false)}
      />
    </section>
  );
}
