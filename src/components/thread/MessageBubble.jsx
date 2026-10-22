import React from 'react';
import { format } from 'date-fns';

/**
 * One chat bubble. Your own messages sit on the right (lime for clients, cyan for creators).
 * Messages sent in a row share one time stamp, shown under the last of them.
 */
export default function MessageBubble({ message, isOwn, isCreatorView, isLastInGroup = true }) {
  const ownStyle = isCreatorView
    ? { background: 'hsl(var(--neon-cyan) / 0.16)', borderColor: 'hsl(var(--neon-cyan) / 0.3)' }
    : { background: 'hsl(var(--neon-lime) / 0.14)', borderColor: 'hsl(var(--neon-lime) / 0.3)' };

  const tail = isLastInGroup ? (isOwn ? 'rounded-br-[6px]' : 'rounded-bl-[6px]') : '';

  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[82%] rounded-[20px] border px-4 py-2.5 sm:max-w-[72%] ${tail}`}
        style={isOwn ? ownStyle : { background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }}
      >
        <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-white/90">
          {message.content}
        </p>
      </div>
      {isLastInGroup && message.created_date && (
        <p className="mt-1 px-1.5 text-[11px] text-white/30">
          {format(new Date(message.created_date), 'h:mm a')}
        </p>
      )}
    </div>
  );
}
