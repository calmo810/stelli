import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import ConfirmAction from '@/components/shared/ConfirmAction';

// The admin page's card look (see AdminDashboard.jsx).
const SURFACE = {
  background: 'linear-gradient(145deg, hsl(var(--surface-2) / .86), hsl(var(--surface) / .94))',
  borderRadius: 22,
  boxShadow: 'inset 0 1px 0 var(--line), 0 18px 42px -30px rgba(0,0,0,.78)',
};

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
    <section className="mb-6 border border-line p-5" style={SURFACE} aria-labelledby="data-fix-title">
      <p className="st-kicker text-fg-3">Run once, right after the update goes live</p>
      <h2 id="data-fix-title" className="mt-2 text-[20px] font-semibold text-fg">
        One-time data fix
      </h2>
      <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-fg-2">
        Bookings, quotes, messages and agreements are now matched to people by account, not email. A few older
        records are missing the account, so their client or creator can't see them until this has run. Check first:
        it changes nothing.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => run(true)}
          disabled={busy}
          className="min-h-[44px] border border-line px-4 text-[14px] font-medium text-fg-2 hover:bg-fill-2 disabled:opacity-40"
          style={{ borderRadius: 14 }}
        >
          {busy && !confirming ? 'Checking…' : 'Check'}
        </button>
        <button
          type="button"
          onClick={() => { setError(''); setConfirming(true); }}
          disabled={busy || !report?.dryRun}
          className="min-h-[44px] px-4 text-[14px] font-semibold disabled:opacity-40"
          style={{ background: 'var(--st-primary)', color: 'var(--st-on-primary)', borderRadius: 14 }}
        >
          Run it
        </button>
      </div>

      {error && !confirming && (
        <p role="alert" className="mt-3 text-[13px]" style={{ color: 'var(--danger)' }}>{error}</p>
      )}

      {report && (
        <div className="mt-4 text-[13px] leading-relaxed text-fg-2" aria-live="polite">
          <p className="font-medium text-fg">
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
            <p className="mt-2 text-fg-2">
              {report.unresolved.length} could not be matched to an account (the person may have deleted it):{' '}
              <span className="st-kicker">
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
