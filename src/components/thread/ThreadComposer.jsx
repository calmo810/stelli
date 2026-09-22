import React, { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { hasContactDetails } from '@/lib/profilePresets';
import { CONTACT_BLOCK_MESSAGE, isConfirmed } from '@/lib/threadStatus';

/** Message box pinned to the bottom of the screen. Enter sends, Shift+Enter breaks. */
export default function ThreadComposer({ onSend, booking, disabled, placeholder }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const locked = !isConfirmed(booking);
  const blocked = locked && hasContactDetails(text);

  const submit = async () => {
    const value = text.trim();
    if (!value || busy) return;

    if (blocked) {
      setError(CONTACT_BLOCK_MESSAGE);
      return;
    }

    setBusy(true);
    setError('');
    try {
      await onSend(value);
      setText('');
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'That message did not send. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-3xl mx-auto px-5 md:px-8 py-3">
        {(error || blocked) && (
          <p
            className="font-body text-[12px] leading-relaxed mb-2.5"
            style={{ color: blocked ? 'hsl(var(--neon-magenta))' : 'hsl(var(--neon-magenta))' }}
          >
            {blocked ? CONTACT_BLOCK_MESSAGE : error}
          </p>
        )}

        <div className="flex items-end gap-3">
          <textarea
            rows={1}
            value={text}
            disabled={disabled}
            placeholder={placeholder || 'Type a message...'}
            onChange={(e) => { setText(e.target.value); setError(''); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            className="flex-1 resize-none border border-white/10 bg-white/[0.03] px-4 py-3 font-body text-[14px] text-white outline-none transition-colors placeholder:text-white/25 focus:border-neon-lime focus:ring-1 focus:ring-neon-lime disabled:opacity-50"
            style={{ borderRadius: 4, maxHeight: 140 }}
          />
          <button
            onClick={submit}
            disabled={disabled || busy || !text.trim()}
            className="shrink-0 w-12 h-12 flex items-center justify-center disabled:opacity-40"
            style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}
            aria-label="Send message"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        {locked && (
          <p className="label-mono text-[9px] text-white/25 mt-2">
            Contact details unlock once the booking is confirmed
          </p>
        )}
      </div>
    </div>
  );
}