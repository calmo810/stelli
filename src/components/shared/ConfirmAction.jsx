import React from 'react';
import { Btn, Dialog, Note } from '@/components/system';

/**
 * The confirmation every money-moving action goes through, on the admin page
 * and in a booking's thread. It says exactly what will happen, in one
 * sentence, before anything does.
 *
 * The confirm button is disabled the moment it is pressed, and the caller
 * sends the same action ID for the life of this dialog, so a double click, or
 * a retry on a slow connection, does the thing once.
 */
/** @param {Record<string, any>} props */
export default function ConfirmAction({ open, title, message, confirmLabel = 'Confirm', busy, error, onConfirm, onCancel, children = null }) {
  return (
    <Dialog open={open} onClose={onCancel} busy={busy} kicker="Please confirm" title={title}>
      <p className="st-body mt-3">{message}</p>
      {children}

      {error && (
        <Note tone="error" className="mt-4">
          {error}
        </Note>
      )}

      <div className="st-dialog__actions">
        {/* Cancel takes the focus first: the safe choice is the default one. */}
        <Btn variant="outline" onClick={onCancel} disabled={busy} data-autofocus>
          Cancel
        </Btn>
        <Btn onClick={onConfirm} loading={busy}>
          {busy ? 'Working…' : confirmLabel}
        </Btn>
      </div>
    </Dialog>
  );
}

/** A fresh ID for one confirmation. Sent with the action so a repeat is recognised. */
export function newActionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `a${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
}
