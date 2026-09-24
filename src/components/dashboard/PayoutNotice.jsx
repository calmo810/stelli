import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

const NAVY = '#0a0f1e';
const CYAN = '#2AE8F8';

/**
 * The short message at the top of the dashboard after Stripe has been checked.
 */
export default function PayoutNotice({ state, onRefresh }) {
  const [busy, setBusy] = useState(false);

  if (!state) return null;

  const start = async () => {
    setBusy(true);
    try {
      const response = await base44.functions.invoke('startPayoutSetup', {
        origin: window.location.origin,
      });
      if (response.data?.url) window.location.href = response.data.url;
      else await onRefresh?.();
    } finally {
      setBusy(false);
    }
  };

  let text;
  let showButton = false;

  if (state.payoutsEnabled) {
    text = "Payouts are set up. You'll get paid after each delivery.";
  } else if (state.needsInfo) {
    text = 'Stripe still needs a few details.';
    showButton = true;
  } else {
    text = "Stripe is checking your info. This page will update once it's done.";
  }

  return (
    <div
      className="mb-6 px-5 py-4 flex flex-wrap items-center justify-between gap-4"
      style={{ background: NAVY, borderRadius: 4, border: '1px solid rgba(255,255,255,0.14)' }}
    >
      <p className="font-body text-[13px] text-white">{text}</p>

      {showButton && (
        <button
          onClick={start}
          disabled={busy}
          className="inline-flex items-center gap-2 px-5 py-2.5 font-body text-[12px] font-semibold disabled:opacity-50"
          style={{ background: CYAN, color: NAVY, borderRadius: 4 }}
        >
          {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Finish payout setup
        </button>
      )}
    </div>
  );
}