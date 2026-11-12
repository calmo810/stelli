import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Btn, Check, Note, Page, Sheet } from '@/components/system';

/**
 * Creators who applied before the 18+ check existed confirm it here, once,
 * before their dashboard opens. The confirmation goes through the backend:
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
    } catch {
      setError('We could not save that. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page width="form">
      <Sheet className="mt-6">
        <p className="st-kicker">Before you continue</p>
        <h1 className="st-h1 mt-2">One quick confirmation.</h1>
        <p className="st-lede mt-3">Stelli is for adults. Confirm you are 18 or older and your workspace opens right up.</p>

        <Check checked={agreed} onChange={setAgreed} className="mt-4">
          I'm 18 or older.
        </Check>

        {error && <Note tone="error" className="mt-2">{error}</Note>}

        <Btn onClick={confirm} disabled={!agreed} loading={saving} arrow="end" block className="mt-5">
          Confirm and continue
        </Btn>
      </Sheet>
    </Page>
  );
}
