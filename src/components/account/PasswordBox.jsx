import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Btn, Card, Field, Note } from '@/components/system';

export default function PasswordBox({ user, googleUser }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const change = async (event) => {
    event.preventDefault();
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
      // The SDK takes one object here. It used to be handed three separate
      // values, which it read as nothing at all, so no change ever went through.
      await base44.auth.changePassword({ userId: user.id, currentPassword: current, newPassword: next });
      setDone('Password updated.');
      setCurrent('');
      setNext('');
      setConfirm('');
      // A quiet confirmation email, so a change nobody made is noticed.
      base44.functions.invoke('notifyPasswordChanged', {}).catch(() => {});
    } catch (e) {
      setError(e?.status === 401 || e?.status === 400 || !e?.message ? "That current password isn't right." : e.message);
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    setError('');
    try {
      await base44.auth.resetPasswordRequest(user.email);
    } catch {
      // Always report success: the API never says whether the address exists.
    }
    setResetSent(true);
  };

  return (
    <Card as="section" aria-labelledby="password-title">
      <h2 id="password-title" className="st-h2">Password</h2>

      {googleUser ? (
        <p className="st-body mt-2">You log in with Google, so there's no Stelli password to change.</p>
      ) : (
        <form onSubmit={change} className="mt-5">
          <Field label="Current password">
            <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className="st-input" />
          </Field>
          <Field label="New password" hint="At least 8 characters.">
            <input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className="st-input" />
          </Field>
          <Field label="Confirm new password">
            <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="st-input" />
          </Field>

          {error && <Note tone="error" className="mt-4">{error}</Note>}
          {done && <Note tone="success" className="mt-4" role="status">{done}</Note>}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Btn type="submit" loading={busy} disabled={!current || !next || !confirm}>
              Save password
            </Btn>
            <button type="button" onClick={forgot} className="st-link inline-flex min-h-[44px] items-center text-[13.5px]">
              Forgot your current password?
            </button>
          </div>
          {resetSent && (
            <p className="st-small mt-3" role="status">We sent a reset link to {user.email}.</p>
          )}
        </form>
      )}
    </Card>
  );
}
