import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, ExternalLink, Loader2, Wallet } from 'lucide-react';

/**
 * Stripe Connect onboarding for a creator's payouts. Stelli never stores bank,
 * tax or ID details — Stripe's own hosted pages handle all of it.
 */
export default function PayoutSetup({ profile, onRefresh }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const handled = useRef(false);

  const started = Boolean(profile?.stripe_account_id);
  const active = Boolean(profile?.payouts_enabled);

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
        window.location.href = data.url;
        return;
      }
      if (action === 'status') await onRefresh();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Stripe could not be reached. Try again.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (handled.current) return;
    const state = new URLSearchParams(window.location.search).get('payouts');
    if (!state) return;
    handled.current = true;
    // Drop the flag so a later refresh does not repeat the call.
    window.history.replaceState({}, '', window.location.pathname);
    // 'done' = Stripe sent them back; 'refresh' = the link expired mid-onboarding.
    if (state === 'done') run('status');
    else if (state === 'refresh') run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="mb-8 border p-5 flex flex-wrap items-center justify-between gap-4"
      style={{ borderColor: 'rgba(26,39,68,0.16)', background: '#ece9e2' }}
    >
      <div>
        <p className="text-[8px] font-body tracking-[0.4em] uppercase mb-2" style={{ color: 'rgba(26,39,68,0.35)' }}>
          Payouts
        </p>
        {active ? (
          <p className="text-sm flex items-center gap-2" style={{ color: 'rgba(26,39,68,0.6)' }}>
            <Check className="w-4 h-4" /> Payouts active
          </p>
        ) : (
          <p className="text-sm" style={{ color: 'rgba(26,39,68,0.6)' }}>
            Set up payouts to send your first quote — takes about 5 minutes with Stripe.
          </p>
        )}
      </div>

      {active ? (
        <button
          onClick={() => run('dashboard')}
          disabled={busy}
          className="inline-flex items-center gap-2 text-xs font-medium underline underline-offset-4 disabled:opacity-50"
          style={{ color: 'rgba(26,39,68,0.6)' }}
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
          Manage payouts
        </button>
      ) : (
        <button
          onClick={() => run()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold disabled:opacity-50"
          style={{ background: '#1a2744', color: '#f0ede6' }}
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
          {started ? 'Finish payout setup' : 'Set up payouts'}
        </button>
      )}

      {error && (
        <p className="text-[11px] w-full" style={{ color: '#b91c4b' }}>{error}</p>
      )}
    </div>
  );
}