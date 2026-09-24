import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, Loader2 } from 'lucide-react';

/**
 * Creators who applied before the 18+ check existed confirm it here, once,
 * before their dashboard opens.
 */
export default function AgeConfirmGate({ profile, onConfirmed }) {
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const confirm = async () => {
    setSaving(true);
    setError('');
    try {
      await base44.entities.Lensman.update(profile.id, {
        age_confirmed: true,
        age_confirmed_at: new Date().toISOString(),
      });
      await onConfirmed();
    } catch (e) {
      setError('We could not save that. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-24" style={{ background: '#f0ede6' }}>
      <div className="max-w-lg w-full border p-8" style={{ borderColor: 'rgba(26,39,68,0.16)' }}>
        <p className="text-[8px] font-body tracking-[0.4em] uppercase mb-4" style={{ color: 'rgba(26,39,68,0.35)' }}>
          Before you continue
        </p>
        <h1 className="font-display text-3xl font-semibold mb-3" style={{ color: '#1a2744' }}>
          One quick confirmation.
        </h1>
        <p className="text-sm mb-8" style={{ color: 'rgba(26,39,68,0.5)' }}>
          Stelli is for adults. Confirm you are 18 or older and your dashboard opens right up.
        </p>

        <button type="button" onClick={() => setAgreed(!agreed)} className="flex items-start gap-3 text-left mb-8">
          <span
            className="w-4 h-4 border flex items-center justify-center shrink-0 mt-0.5"
            style={{
              borderRadius: 3,
              borderColor: agreed ? '#1a2744' : 'rgba(26,39,68,0.3)',
              background: agreed ? '#1a2744' : 'transparent',
            }}
          >
            {agreed && <Check className="w-3 h-3" strokeWidth={3} style={{ color: '#f0ede6' }} />}
          </span>
          <span className="text-sm" style={{ color: 'rgba(26,39,68,0.65)' }}>I'm 18 or older.</span>
        </button>

        {error && <p className="text-xs mb-4" style={{ color: '#b91c4b' }}>{error}</p>}

        <button
          onClick={confirm}
          disabled={!agreed || saving}
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-semibold disabled:opacity-40"
          style={{ background: '#1a2744', color: '#f0ede6' }}
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Confirm and continue
        </button>
      </div>
    </div>
  );
}