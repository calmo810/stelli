import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * The confirmation every money-moving action goes through — on the admin page
 * and in a booking's thread. It says
 * exactly what will happen, in one sentence, before anything does.
 *
 * The confirm button is disabled the moment it is pressed, and the caller
 * sends the same action ID for the life of this dialog — so a double click,
 * or a retry on a slow connection, does the thing once.
 */
export default function ConfirmAction({ open, title, message, confirmLabel = 'Confirm', busy, error, onConfirm, onCancel, children }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    cancelRef.current?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape' && !busy) onCancel?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-[#0a0f1e]/85 px-4 py-6 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-action-title"
    >
      <div
        className="w-full max-w-md border border-white/15 p-6"
        style={{ background: 'hsl(var(--surface))', borderRadius: 4 }}
      >
        <p className="label-mono text-[9px] text-white/40">Please confirm</p>
        <h2 id="confirm-action-title" className="mt-3 font-heading text-[22px] font-semibold leading-tight text-white">
          {title}
        </h2>
        <p className="mt-3 font-body text-[14px] leading-relaxed text-white/75">{message}</p>
        {children}

        {error && (
          <p role="alert" className="mt-4 font-body text-[13px]" style={{ color: 'hsl(var(--neon-magenta))' }}>
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-[48px] flex-1 border border-white/15 px-4 font-body text-[14px] font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-40"
            style={{ borderRadius: 4 }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 px-4 font-body text-[14px] font-semibold disabled:opacity-60"
            style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** A fresh ID for one confirmation. Sent with the action so a repeat is recognised. */
export function newActionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `a${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
}
