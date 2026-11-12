import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import { fieldClass } from '@/lib/glassField';
import SectionLabel from '@/components/creator/SectionLabel';

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
      <section>
        <SectionLabel>Delete account</SectionLabel>
        <div className="glass rounded-3xl p-4 sm:p-5">
          <p className="text-[15px] leading-snug text-white/70">
            Your profile, photos and messages come off Stelli. This cannot be undone.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-neon-magenta/40 px-[18px] py-[11px] text-[14px] font-semibold text-neon-magenta transition-colors hover:bg-neon-magenta/10"
          >
            <Trash2 className="h-4 w-4" /> Delete my account
          </button>
        </div>
      </section>

      {open && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-black/70 backdrop-blur-sm px-5"
          role="dialog"
          aria-modal="true"
          aria-label="Delete account"
        >
          <div className="glass w-full max-w-md rounded-[28px] bg-ink/90 p-6">
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-[52px] w-[52px] place-items-center rounded-2xl bg-neon-magenta/15 text-neon-magenta">
                <AlertTriangle className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.08] text-white/60 transition-colors hover:bg-white/[0.14] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {stage === 1 ? (
              <>
                <h3 className="mt-4 font-display text-[26px] font-medium leading-tight text-white">Delete your account?</h3>
                <p className="mt-2 text-[15px] leading-snug text-white/65">
                  Your creator profile, portfolio and access to your shoots will be removed. Shoots with
                  money still in escrow have to be finished or cancelled first.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-full px-[18px] py-[11px] text-[14px] font-semibold text-white/70 hover:text-white transition-colors"
                  >
                    Keep my account
                  </button>
                  <button
                    type="button"
                    onClick={() => setStage(2)}
                    className="rounded-full px-[18px] py-[11px] text-[14px] font-semibold bg-neon-magenta text-ink hover:opacity-90 transition-opacity"
                  >
                    Continue
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="mt-4 font-display text-[26px] font-medium leading-tight text-white">Last step</h3>
                <p className="mt-2 text-[15px] leading-snug text-white/65">
                  Type <span className="font-semibold text-white">DELETE</span> to confirm. There is no way
                  back after this.
                </p>
                <input
                  value={typed}
                  onChange={(event) => setTyped(event.target.value)}
                  placeholder="DELETE"
                  autoFocus
                  className={`${fieldClass} mt-4`}
                />
                {error && <p role="alert" className="mt-3 text-[14px] text-neon-magenta">{error}</p>}
                <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
                  <button
                    type="button"
                    onClick={close}
                    disabled={busy}
                    className="rounded-full px-[18px] py-[11px] text-[14px] font-semibold text-white/70 hover:text-white transition-colors disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={remove}
                    disabled={typed.trim() !== 'DELETE' || busy}
                    className="inline-flex items-center justify-center gap-2 rounded-full px-[18px] py-[11px] text-[14px] font-semibold bg-neon-magenta text-ink hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
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