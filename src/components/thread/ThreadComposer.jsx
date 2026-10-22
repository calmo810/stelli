import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { hasContactDetails } from '@/lib/profilePresets';
import { CONTACT_BLOCK_MESSAGE, isConfirmed } from '@/lib/threadStatus';

/**
 * The message box at the bottom of a chat. It grows as you type.
 * Enter sends, Shift+Enter starts a new line. Suggestions fill the box — they never send on their own.
 */
export default function ThreadComposer({ onSend, booking, disabled, placeholder, suggestions = [] }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const box = useRef(null);

  const locked = !isConfirmed(booking);
  const blocked = locked && hasContactDetails(text);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [text]);

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
      box.current?.focus();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'That message did not send. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="shrink-0 border-t border-white/[0.08] bg-ink/80 px-3 pt-3 backdrop-blur-xl sm:px-5"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      {suggestions.length > 0 && !text && (
        <div className="no-scrollbar mb-2.5 flex gap-2 overflow-x-auto">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setText(s);
                box.current?.focus();
              }}
              className="shrink-0 rounded-full bg-white/[0.08] px-3.5 py-2 text-[13px] text-white/70 transition-colors hover:bg-white/[0.14] hover:text-white"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {(error || blocked) && (
        <p className="mb-2 px-1 text-[13px] leading-relaxed" style={{ color: 'hsl(var(--neon-magenta))' }}>
          {blocked ? CONTACT_BLOCK_MESSAGE : error}
        </p>
      )}

      <div className="glass flex items-end gap-2 rounded-[26px] p-2">
        <textarea
          ref={box}
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
          className="min-h-[44px] flex-1 resize-none bg-transparent px-3 py-3 text-[15px] leading-[20px] text-white outline-none placeholder:text-white/30 disabled:opacity-50"
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
  );
}
