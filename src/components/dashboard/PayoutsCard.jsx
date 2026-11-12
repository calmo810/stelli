import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { money } from '@/lib/format';


/**
 * The creator's payout state in one line. Stelli never stores bank or tax
 * details — Stripe's own hosted pages handle all of it.
 */
export default function PayoutsCard({ profile, needsInfo, waitingTotal = 0, onRefresh }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const resumed = useRef(false);

  const started = Boolean(profile?.stripe_account_id);
  const active = Boolean(profile?.payouts_enabled);
  const waiting = Number(waitingTotal || 0) > 0;

  const run = async (action) => {
    setBusy(true);
    setError('');
    try {
      const response = await base44.functions.invoke('startPayoutSetup', {
        origin: window.location.origin,
        action,
      });
      const data = response.data || {};
      if (data.url) {
        if (action === 'dashboard') window.open(data.url, '_blank', 'noopener');
        else window.location.href = data.url;
        return;
      }
      if (action === 'status') await onRefresh?.();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Stripe could not be reached. Try again.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (resumed.current) return;
    const state = new URLSearchParams(window.location.search).get('payouts');
    if (!state) return;
    resumed.current = true;
    // Drop the flag so a later refresh does not repeat this.
    window.history.replaceState({}, '', window.location.pathname);
    // An expired onboarding link puts them straight back into Stripe.
    if (state === 'refresh') run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let heading;
  let text;
  let button = null;
  let link = null;

  if (active) {
    heading = 'Payouts are on.';
    text = 'Manage your bank details and payout schedule in Stripe.';
    link = 'Manage payouts';
  } else if (waiting) {
    heading = `${money(waitingTotal)} is waiting.`;
    text = 'Set up payouts and we will send it over.';
    button = started ? 'Finish setup' : 'Set up';
  } else if (started && needsInfo === false) {
    heading = 'Stripe is checking your info.';
    text = 'This page updates on its own once that is done.';
  } else if (started) {
    heading = 'You started payout setup.';
    text = 'Pick up where you left off — it takes a minute.';
    button = 'Finish setup';
  } else {
    heading = 'Set up payouts.';
    text = 'So you can get paid. Takes a couple of minutes.';
    button = 'Set up';
  }

  return (
    <div>
      <div className={`wk-card wk-card--pad flex flex-wrap items-center gap-3.5 ${waiting && !active ? 'wk-card--lime' : ''}`}>
        <span
          aria-hidden
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: active ? '#8fa52c' : '#1b5a66' }}
        />

        <p className="min-w-0 flex-1 basis-[60%]">
          <b className="block text-[15px] font-bold text-ink">{heading}</b>
          <small className="mt-0.5 block text-[13px] leading-snug wk-grey">{text}</small>
        </p>

        {button && (
          <button type="button" className="wk-btn wk-btn--ink" onClick={() => run()} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {button}
          </button>
        )}

        {link && (
          <button type="button" className="wk-btn wk-btn--ghost" onClick={() => run('dashboard')} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {link}
          </button>
        )}
      </div>

      {error && <p className="mt-2 pl-1 text-[13px] wk-chip--blush">{error}</p>}
    </div>
  );
}