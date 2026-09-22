import React from 'react';
import { format } from 'date-fns';

/** One chat bubble. The creator's own messages are cyan on their side. */
export default function MessageBubble({ message, isOwn, isCreatorView }) {
  const ownStyle = isCreatorView
    ? { background: 'hsl(var(--neon-cyan) / 0.14)', borderColor: 'hsl(var(--neon-cyan) / 0.3)' }
    : { background: 'hsl(var(--surface-2))', borderColor: 'rgba(255,255,255,0.12)' };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className="max-w-[80%] border px-4 py-3"
        style={{ borderRadius: 4, ...(isOwn ? ownStyle : { background: 'hsl(var(--surface))', borderColor: 'rgba(255,255,255,0.1)' }) }}
      >
        {!isOwn && (
          <p className="label-mono text-[8px] text-white/30 mb-1.5">{message.sender_name}</p>
        )}
        <p className="font-body text-[14px] leading-relaxed text-white/85 whitespace-pre-wrap break-words">
          {message.content}
        </p>
        {message.created_date && (
          <p className="label-mono text-[8px] text-white/25 mt-2">
            {format(new Date(message.created_date), 'h:mm a')}
          </p>
        )}
      </div>
    </div>
  );
}