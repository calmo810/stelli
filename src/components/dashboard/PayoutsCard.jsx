import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

const NAVY = '#0a0f1e';
const CYAN = '#2AE8F8';

function money(amount) {
  const value = Number(amount || 0);
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * The creator's payout state in one card. Stelli never stores bank or tax
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

  let text;
  let button = null;
  let link = null;

  if (active) {
    text = 'Payouts active';
    link = 'Manage payouts.';
  } else if (waiting) {
    text = `You have ${money(waitingTotal)} waiting. Set up payouts to get it.`;
    button = started ? 'Finish payout setup' : 'Set up payouts';
  } else if (started && needsInfo === false) {
    text = "Stripe is checking your info. This page will update once it's done.";
  } else if (started) {
    text = "You started payout setup but didn't finish.";
    button = 'Finish payout setup';
  } else {
    text = 'Set up payouts so you can get paid. It takes a few minutes.';
    button = 'Set up payouts';
  }

  return (
    <div
      className="mb-8 p-6"
      style={{
        background: NAVY,
        borderRadius: 4,
        border: `1px solid ${waiting ? CYAN : 'rgba(255,255,255,0.14)'}`,
      }}
    >
      <p
        className="font-body text-[10px] uppercase tracking-[0.3em] mb-3"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        Payouts
      </p>

      <h3 className="font-heading font-semibold text-white text-[24px] leading-tight max-w-[620px]">
        {text}
      </h3>

      {(button || link) && (
        <div className="mt-5">
          {button && (
            <button
              onClick={() => run()}
              disabled={busy}
              className="inline-flex items-center gap-2 px-7 py-3.5 font-body text-[13px] font-semibold transition-transform duration-300 hover:-translate-y-0.5 disabled:opacity-50"
              style={{ background: CYAN, color: NAVY, borderRadius: 4 }}
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {button}
            </button>
          )}

          {link && (
            <button
              onClick={() => run('dashboard')}
              disabled={busy}
              className="inline-flex items-center gap-2 font-body text-[12px] underline underline-offset-4 disabled:opacity-50"
              style={{ color: CYAN }}
            >
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {link}
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="font-body text-[12px] mt-4" style={{ color: 'hsl(var(--neon-magenta))' }}>
          {error}
        </p>
      )}
    </div>
  );
}