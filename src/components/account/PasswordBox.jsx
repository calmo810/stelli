import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { fieldClass, labelClass } from '@/lib/glassField';
import Pill from '@/components/shared/Pill';
import SectionLabel from '@/components/creator/SectionLabel';

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[12px] text-white/40">{hint}</span>}
    </label>
  );
}

export default function PasswordBox({ user, googleUser }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const change = async () => {
    setError('');
    setDone('');
    if (next.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (next !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      await base44.auth.changePassword(user.id, current, next);
      setDone('Password updated.');
      setCurrent('');
      setNext('');
      setConfirm('');
      // A quiet confirmation email, so a change nobody made is noticed.
      base44.functions.invoke('notifyPasswordChanged', {}).catch(() => {});
    } catch (e) {
      setError("That password isn't right.");
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    setError('');
    try {
      await base44.auth.resetPasswordRequest(user.email);
    } catch {
      // Always report success — the API never says whether the address exists.
    }
    setResetSent(true);
  };

  return (
    <section>
      <SectionLabel>Password</SectionLabel>
      <div className="glass rounded-3xl p-4 sm:p-5">
        {googleUser ? (
          <p className="text-[15px] leading-snug text-white/75">
            You log in with Google, so there's no Stelli password to change.
          </p>
        ) : (
          <>
            <div className="space-y-4">
              <Field label="Current password">
                <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={fieldClass} />
              </Field>

              <Field label="New password" hint="At least 8 characters.">
                <input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={fieldClass} />
              </Field>

              <Field label="Confirm new password">
                <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={fieldClass} />
              </Field>
            </div>

            {error && <p role="alert" className="mt-4 text-[14px] leading-snug" style={{ color: 'hsl(var(--neon-magenta))' }}>{error}</p>}
            {done && <p role="status" className="mt-4 text-[14px] leading-snug text-neon-lime">{done}</p>}

            <Pill
              as="button"
              type="button"
              tone="lime"
              onClick={change}
              disabled={busy || !current || !next || !confirm}
              className="mt-5 h-12 w-full sm:w-auto sm:px-8"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Save new password
            </Pill>

            <div className="mt-5 border-t border-white/[0.08] pt-4">
              <button
                type="button"
                onClick={forgot}
                className="text-[14px] text-white/55 underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                Forgot your current password?
              </button>
              {resetSent && (
                <p role="status" className="mt-2 text-[14px] text-white/70">
                  We sent a reset link to {user.email}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
