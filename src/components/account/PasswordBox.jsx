import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

const fieldClass =
  'w-full border border-white/10 bg-white/[0.03] px-4 py-3 font-body text-[14px] text-white outline-none transition-colors focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan';

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block label-mono text-[10px] text-white/40 mb-2.5">{label}</span>
      {children}
      {hint && <span className="block font-body text-[11px] text-white/50 mt-2">{hint}</span>}
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
    <section
      className="border p-6 space-y-6"
      style={{ background: 'hsl(var(--surface))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 4 }}
    >
      <h2 className="font-heading text-2xl font-semibold text-white">Password</h2>

      {googleUser ? (
        <p className="font-body text-[14px] text-white/70">
          You log in with Google, so there's no Stelli password to change.
        </p>
      ) : (
        <>
          <p className="font-body text-[14px] text-white/70">Change password.</p>

          <Field label="Current password">
            <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className={fieldClass} style={{ borderRadius: 4 }} />
          </Field>

          <Field label="New password" hint="At least 8 characters.">
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className={fieldClass} style={{ borderRadius: 4 }} />
          </Field>

          <Field label="Confirm new password">
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={fieldClass} style={{ borderRadius: 4 }} />
          </Field>

          {error && <p className="font-body text-[12px]" style={{ color: 'hsl(var(--neon-magenta))' }}>{error}</p>}
          {done && <p className="font-body text-[12px]" style={{ color: 'hsl(var(--neon-cyan))' }}>{done}</p>}

          <button
            type="button"
            onClick={change}
            disabled={busy || !current || !next || !confirm}
            className="inline-flex items-center gap-2 px-8 py-3.5 label-mono text-[10px] font-semibold disabled:opacity-40"
            style={{ background: '#2AE8F8', color: '#0a0f1e', borderRadius: 4 }}
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save
          </button>

          <div className="pt-2 border-t border-white/10">
            <button type="button" onClick={forgot} className="font-body text-[12px] text-white/50 hover:text-white underline underline-offset-4">
              Forgot your current password?
            </button>
            {resetSent && (
              <p className="font-body text-[12px] text-white/60 mt-3">
                We sent a reset link to {user.email}
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}