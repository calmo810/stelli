import React from 'react';

/** A quiet notice from Stelli — cancellations, holds, delivery events. */
export default function SystemNotice({ message }) {
  return (
    <div className="text-center px-6 py-1">
      <p className="text-[12px] leading-relaxed text-fg-3 max-w-md mx-auto">
        {message.content}
      </p>
    </div>
  );
}