import React from 'react';
import { format } from 'date-fns';

/** One chat bubble. The creator's own messages are cyan on their side. */
export default function MessageBubble({ message, isOwn, isCreatorView }) {
  const ownStyle = isCreatorView
    ? { background: 'hsl(var(--neon-cyan) / 0.16)', borderColor: 'hsl(var(--neon-cyan) / 0.3)' }
    : { background: 'hsl(var(--neon-lime) / 0.14)', borderColor: 'hsl(var(--neon-lime) / 0.3)' };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className="max-w-[80%] rounded-[20px] border px-4 py-3"
        style={isOwn ? ownStyle : { background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' }}
      >
        {!isOwn && (
          <p className="mb-1.5 text-[11px] font-semibold text-white/40">{message.sender_name}</p>
        )}
        <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-white/90">
          {message.content}
        </p>
        {message.created_date && (
          <p className="mt-1.5 text-[11px] text-white/30">
            {format(new Date(message.created_date), 'h:mm a')}
          </p>
        )}
      </div>
    </div>
  );
}