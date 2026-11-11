import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { founderQueue, money } from '@/lib/founderQueue';
import ConfirmAction, { newActionId } from '@/components/shared/ConfirmAction';

// The admin page's card look (see AdminDashboard.jsx).
const SURFACE = {
  background: 'linear-gradient(145deg, hsl(var(--surface-2) / .86), hsl(var(--surface) / .94))',
  borderRadius: 22,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08), 0 18px 42px -30px rgba(0,0,0,.78)',
};
const CARD = 'border border-white/10';

const KIND_LABEL = {
  dispute: 'Card dispute',
  pull_back: 'Payout to pull back',
  stray_payment: 'Unmatched payment',
  problem: 'Problem reported',
  problem_after_payout: 'Problem reported',
  payout_failed: 'Payout failing',
  refund_failed: 'Refund failed',
  test_payment: 'Test payment',
  review: 'Needs a decision',
  creator_cancelled: 'Creator cancelled',
  overdue_delivery: 'Nothing delivered',
  payout_setup: 'Waiting on payout setup',
  unanswered_request: 'No reply yet',
};

/**
 * Everything waiting on a founder, most urgent first. Each item says what is
 * wrong and offers only the actions that settle it. Anything that moves money
 * asks first, in a sentence with the amounts, and reports what happened after.
 */
export default function FounderQueueList({ bookings, strays = null }) {
  const queryClient = useQueryClient();
  const queue = useMemo(() => founderQueue(bookings, Date.now(), strays), [bookings, strays]);
  const [pending, setPending] = useState(null); // { item, action, actionId }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState({}); // bookingId -> { ok, message }

  const run = async ({ item, action, actionId }) => {
    setBusy(true);
    setError('');
    try {
      // Putting a creator on hold is a decision about the creator, not the money.
      const response =
        action.action === 'hold_creator'
          ? await base44.functions.invoke('reviewCreator', {
              lensmanId: item.booking.lensman_id,
              decision: 'hold',
              note: item.booking.flag_reason || '',
            })
          : await base44.functions.invoke('releasePayout', {
              bookingId: item.id,
              action: action.action,
              actionId,
              // Which unmatched payment, when a booking has more than one.
              ...(action.strayId ? { strayId: action.strayId } : {}),
            });
      const data = response.data || {};
      if (data.error) throw new Error(data.error);
      setNotes((prev) => ({ ...prev, [item.id]: { ok: Boolean(data.ok), message: data.message || '' } }));
      setPending(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-audit-log'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-stray-payments'] });
    } catch (e) {
      // The dialog stays open with the same action ID, so trying again is safe.
      setError(e?.response?.data?.error || e.message || 'That did not go through. Nothing was changed.');
    } finally {
      setBusy(false);
    }
  };

  const start = (item, action) => {
    setError('');
    const next = { item, action, actionId: newActionId() };
    if (!action.confirm) run(next);
    else setPending(next);
  };

  if (!queue.length) {
    return <p className="py-20 text-center font-body text-[13px] text-white/45">Nothing is waiting on you.</p>;
  }

  return (
    <div className="space-y-4">
      {queue.map((item) => {
        const b = item.booking;
        const note = notes[item.id];
        return (
          <div key={item.id} className={`${CARD} p-5 sm:p-6`} style={SURFACE}>
            <p className="label-mono text-[9px] text-neon-magenta">{KIND_LABEL[item.kind] || 'Needs a look'}</p>
            <h3 className="mt-2 font-heading text-[20px] font-semibold leading-tight text-white">{item.headline}</h3>
            <p className="mt-2 label-mono text-[9px] text-white/40">
              {b.client_name || 'Client'} with {b.lensman_name || 'creator'} · {b.event_date || 'no date'}
              {Number(b.amount_charged) > 0 ? ` · charged ${money(b.amount_charged)}` : ''}
            </p>

            {item.detail && (
              <p className="mt-3 font-body text-[13px] leading-relaxed text-white/60">{item.detail}</p>
            )}

            {b.problem_note && (
              <p
                className="mt-3 border-l-2 pl-4 font-body text-[13px] leading-relaxed text-white/75"
                style={{ borderColor: 'hsl(var(--neon-magenta) / 0.5)' }}
              >
                {b.problem_note}
              </p>
            )}

            {item.actions.length > 0 && (
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                {item.actions.map((action) => (
                  <button
                    key={action.key || action.action}
                    type="button"
                    onClick={() => start(item, action)}
                    disabled={busy}
                    className={`min-h-[48px] flex-1 px-4 font-body text-[14px] font-semibold transition-colors disabled:opacity-50 ${
                      action.tone === 'lime' ? '' : 'border border-white/15 text-white/75 hover:bg-white/5 hover:text-white'
                    }`}
                    style={
                      action.tone === 'lime'
                        ? { background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 14 }
                        : { borderRadius: 14 }
                    }
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {note?.message && (
              <p
                role="status"
                className="mt-4 font-body text-[13px]"
                style={{ color: note.ok ? 'hsl(var(--neon-lime))' : 'hsl(var(--neon-magenta))' }}
              >
                {note.message}
              </p>
            )}
          </div>
        );
      })}

      <ConfirmAction
        open={Boolean(pending)}
        title={pending?.action.label || ''}
        message={pending?.action.confirm || ''}
        confirmLabel="Yes, do it"
        busy={busy}
        error={error}
        onConfirm={() => pending && run(pending)}
        onCancel={() => {
          setPending(null);
          setError('');
        }}
      />
    </div>
  );
}
