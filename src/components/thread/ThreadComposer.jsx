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
      className="fixed inset-x-0 bottom-0 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto w-full max-w-[640px] px-4 pb-4 sm:px-5">
        {(error || blocked) && (
          <p className="mb-2 px-1 text-[13px] leading-relaxed" style={{ color: 'hsl(var(--neon-magenta))' }}>
            {blocked ? CONTACT_BLOCK_MESSAGE : error}
          </p>
        )}

        <div className="glass flex items-end gap-2.5 rounded-[26px] p-2.5">
          <textarea
            rows={1}
            value={text}
            disabled={disabled}
            placeholder={placeholder || 'Type a message...'}
            onChange={(e) => {
              setText(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            className="flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] text-white outline-none placeholder:text-white/30 disabled:opacity-50"
            style={{ maxHeight: 140 }}
          />
          <button
            type="button"
            onClick={submit}
            disabled={disabled || busy || !text.trim()}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full transition-transform active:scale-[0.96] disabled:opacity-40"
            style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))' }}
            aria-label="Send message"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>

        {locked && (
          <p className="mt-2 px-1 text-[12px] text-white/30">
            Contact details unlock once the booking is confirmed
          </p>
        )}
      </div>
    </div>
  );
}