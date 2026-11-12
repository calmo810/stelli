import React from 'react';
import { format } from 'date-fns';

/**
 * One chat bubble. Your own messages sit on the right (lime for clients, cyan for creators).
 * Messages sent in a row share one time stamp, shown under the last of them.
 */
/** @param {Record<string, any>} props */
export default function MessageBubble({ message, isOwn, isLastInGroup = true }) {
  const pending = !!message.pending;

  // Your own words sit in the dark bubble; theirs in the quiet one.
  const ownStyle = { background: 'var(--st-primary)', borderColor: 'transparent', color: 'var(--st-on-primary)' };

  const tail = isLastInGroup ? (isOwn ? 'rounded-br-[6px]' : 'rounded-bl-[6px]') : '';

  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[82%] rounded-[20px] border px-4 py-2.5 sm:max-w-[72%] ${tail} ${
          pending ? 'opacity-60' : ''
        }`}
        style={isOwn ? ownStyle : { background: 'var(--fill)', borderColor: 'transparent', color: 'var(--fg)' }}
      >
        <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
          {message.content}
        </p>
      </div>
      {isLastInGroup && pending && <p className="mt-1 px-1.5 text-[11px] text-fg-3">Sending…</p>}
      {isLastInGroup && !pending && message.created_date && (
        <p className="mt-1 px-1.5 text-[11px] text-fg-3">
          {format(new Date(message.created_date), 'h:mm a')}
        </p>
      )}
    </div>
  );
}