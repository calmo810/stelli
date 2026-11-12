import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { FIELD_SECTION, SECTIONS, readFailure } from '@/lib/creatorProfile';

/**
 * Shown when a founder has asked for a change before approving: their note,
 * and the one button that sends the page back to the review queue once the
 * creator has fixed it from the lines below.
 */
export default function ChangesRequested({ note, onSent }) {
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState('');

  const sendBack = async () => {
    setSending(true);
    setProblem('');
    try {
      const response = await base44.functions.invoke('updateCreatorProfile', { resubmit: true });
      if (response?.data?.error) throw Object.assign(new Error(response.data.error), { data: response.data });
      await onSent();
    } catch (error) {
      const { message, field } = readFailure(error);
      const section = SECTIONS[FIELD_SECTION[field]];
      setProblem(section ? `${message} Fix it under “${section.label}” below.` : message);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="wk-card wk-card--lime wk-card--pad">
      <p className="wk-label">One thing before you go live</p>
      <p className="mt-2 whitespace-pre-line text-[15px] font-semibold leading-snug text-ink">
        {note || 'We sent you a note by email about what to change.'}
      </p>
      <p className="wk-body mt-2">Change it from the lines below, then send your page back to us.</p>
      {problem && (
        <p className="cf-error" role="alert">
          {problem}
        </p>
      )}
      <div className="mt-4">
        <button type="button" className="wk-btn wk-btn--ink" onClick={sendBack} disabled={sending}>
          {sending ? 'Sending…' : 'Send back for review'}
        </button>
      </div>
    </section>
  );
}
