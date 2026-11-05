import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Trash2, X, AlertTriangle } from 'lucide-react';

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
      setError(err?.response?.data?.error || err.message || 'Something went wrong. Try again.');
      setBusy(false);
    }
  };

  return (
    <>
      <div className="glass rounded-2xl p-5 md:p-6">
        <p className="label-mono text-[10px] text-white/40">Danger zone</p>
        <h2 className="mt-2 text-white font-semibold text-lg">Delete account</h2>
        <p className="mt-2 text-sm text-white/55 leading-relaxed">
          Your profile, photos and messages come off Stelli. This cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-neon-magenta border border-neon-magenta/40 hover:bg-neon-magenta/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Delete my account
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-black/70 backdrop-blur-sm px-5"
          role="dialog"
          aria-modal="true"
          aria-label="Delete account"
        >
          <div className="glass w-full max-w-md rounded-2xl p-6 bg-ink/90">
            <div className="flex items-start justify-between gap-4">
              <span className="grid place-items-center w-10 h-10 rounded-full bg-neon-magenta/15 text-neon-magenta">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="text-white/40 hover:text-white transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {stage === 1 ? (
              <>
                <h3 className="mt-4 text-white font-semibold text-xl">Delete your account?</h3>
                <p className="mt-2 text-sm text-white/60 leading-relaxed">
                  Your creator profile, portfolio and access to your shoots will be removed. Shoots with
                  money still in escrow have to be finished or cancelled first.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-full px-4 py-2.5 text-sm font-semibold text-white/70 hover:text-white transition-colors"
                  >
                    Keep my account
                  </button>
                  <button
                    type="button"
                    onClick={() => setStage(2)}
                    className="rounded-full px-4 py-2.5 text-sm font-semibold bg-neon-magenta text-ink hover:opacity-90 transition-opacity"
                  >
                    Continue
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="mt-4 text-white font-semibold text-xl">Last step</h3>
                <p className="mt-2 text-sm text-white/60 leading-relaxed">
                  Type <span className="font-semibold text-white">DELETE</span> to confirm. There is no way
                  back after this.
                </p>
                <input
                  value={typed}
                  onChange={(event) => setTyped(event.target.value)}
                  placeholder="DELETE"
                  autoFocus
                  className="mt-4 w-full rounded-xl bg-white/5 border border-white/15 px-4 py-3 text-white placeholder:text-white/25 focus:border-neon-lime/60 focus:outline-none"
                />
                {error && <p className="mt-3 text-sm text-neon-magenta">{error}</p>}
                <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
                  <button
                    type="button"
                    onClick={close}
                    disabled={busy}
                    className="rounded-full px-4 py-2.5 text-sm font-semibold text-white/70 hover:text-white transition-colors disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={remove}
                    disabled={typed.trim() !== 'DELETE' || busy}
                    className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold bg-neon-magenta text-ink hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {busy ? 'Deleting…' : 'Delete account'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}