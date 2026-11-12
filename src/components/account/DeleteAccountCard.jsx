import React, { useState } from 'react';
import { base44, errorMessage } from '@/api/base44Client';
import { Trash2 } from 'lucide-react';
import { Btn, Card, Dialog, Field, Note } from '@/components/system';

/* Closing an account takes two answers: the explanation, then the word itself.
   Nothing is deleted until the second one lands. */
export default function DeleteAccountCard() {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState(1);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    if (busy) return;
    setOpen(false);
    setStage(1);
    setTyped('');
    setError('');
  };

  const remove = async () => {
    setBusy(true);
    setError('');
    try {
      await base44.functions.invoke('deleteMyAccount', { confirm: 'DELETE' });
      await base44.auth.logout('/');
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <>
      <Card as="section" tone="blush" aria-labelledby="delete-title">
        <p className="st-kicker">Danger zone</p>
        <h2 id="delete-title" className="st-h3 mt-1.5">Delete account</h2>
        <p className="st-body mt-1">Your profile, photos and messages come off Stelli. This cannot be undone.</p>
        <Btn variant="danger" size="sm" className="mt-4" onClick={() => setOpen(true)}>
          <Trash2 aria-hidden /> Delete my account
        </Btn>
      </Card>

      <Dialog open={open} onClose={close} busy={busy} title={stage === 1 ? 'Delete your account?' : 'Last step'}>
        {stage === 1 ? (
          <>
            <p className="st-body mt-3">
              Your creator profile, portfolio and access to your shoots will be removed. Shoots with money still held
              have to be finished or cancelled first.
            </p>
            <div className="st-dialog__actions">
              <Btn variant="outline" onClick={close} data-autofocus>
                Keep my account
              </Btn>
              <Btn variant="danger" onClick={() => setStage(2)}>
                Continue
              </Btn>
            </div>
          </>
        ) : (
          <>
            <p className="st-body mt-3">
              Type <b className="font-bold text-fg">DELETE</b> to confirm. There is no way back after this.
            </p>
            <Field label="Type DELETE" className="mt-4">
              <input value={typed} onChange={(event) => setTyped(event.target.value)} placeholder="DELETE" autoComplete="off" className="st-input" data-autofocus />
            </Field>
            {error && <Note tone="error" className="mt-3">{error}</Note>}
            <div className="st-dialog__actions">
              <Btn variant="outline" onClick={close} disabled={busy}>
                Cancel
              </Btn>
              <Btn variant="danger" onClick={remove} disabled={typed.trim() !== 'DELETE'} loading={busy}>
                {busy ? 'Deleting…' : 'Delete account'}
              </Btn>
            </div>
          </>
        )}
      </Dialog>
    </>
  );
}
