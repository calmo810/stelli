import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, Loader2 } from 'lucide-react';

/**
 * Creators who applied before the 18+ check existed confirm it here, once,
 * before their dashboard opens. The confirmation goes through the backend —
 * the browser never writes to the creator record.
 */
export default function AgeConfirmGate({ onConfirmed }) {
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const confirm = async () => {
    setSaving(true);
    setError('');
    try {
      await base44.functions.invoke('confirmAge', {});
      await onConfirmed();
    } catch (e) {
      setError('We could not save that. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-24" style={{ background: '#0a0f1e' }}>
      <div className="max-w-lg w-full border p-8" style={{ borderColor: 'rgba(255,255,255,0.12)', borderRadius: 4 }}>
        <p className="label-mono text-[9px] text-white/35 mb-4">Before you continue</p>
        <h1 className="font-heading text-3xl font-semibold mb-3 text-white">One quick confirmation.</h1>
        <p className="font-body text-sm mb-8 text-white/50">
          Stelli is for adults. Confirm you are 18 or older and your dashboard opens right up.
        </p>

        <button type="button" onClick={() => setAgreed(!agreed)} className="flex items-start gap-3 text-left mb-8">
          <span
            className="w-4 h-4 border flex items-center justify-center shrink-0 mt-0.5"
            style={{
              borderRadius: 3,
              borderColor: agreed ? '#2AE8F8' : 'rgba(255,255,255,0.3)',
              background: agreed ? '#2AE8F8' : 'transparent',
            }}
          >
            {agreed && <Check className="w-3 h-3" strokeWidth={3} style={{ color: '#0a0f1e' }} />}
          </span>
          <span className="font-body text-sm text-white/70">I'm 18 or older.</span>
        </button>

        {error && <p className="font-body text-xs mb-4" style={{ color: 'hsl(var(--neon-magenta))' }}>{error}</p>}

        <button
          onClick={confirm}
          disabled={!agreed || saving}
          className="inline-flex items-center gap-2 px-6 py-3 label-mono text-[10px] font-semibold disabled:opacity-40"
          style={{ background: '#2AE8F8', color: '#0a0f1e', borderRadius: 4 }}
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Confirm and continue
        </button>
      </div>
    </div>
  );
}