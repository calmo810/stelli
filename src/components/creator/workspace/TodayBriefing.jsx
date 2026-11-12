import React from 'react';

/**
 * The one-sentence brief at the top of Today: what is on, in plain words, with
 * the numbers bolded — plus the faces of the clients it is about.
 */
export default function TodayBriefing({ segments = [], people = [] }) {
  const shown = people.slice(0, 3);
  const extra = people.length - shown.length;

  return (
    <div>
      <p className="text-[16.5px] leading-[1.45] text-white/70">
        {segments.map((segment, i) =>
          segment.bold ? (
            <b key={i} className="font-extrabold text-white">
              {segment.text}
            </b>
          ) : (
            <span key={i}>{segment.text}</span>
          )
        )}
      </p>

      {people.length > 0 && (
        <div className="mt-3 flex items-center gap-2.5">
          <span className="wk-stack">
            {shown.map((person) => (
              <span key={person.name} className="wk-stack-av">
                {person.initial}
              </span>
            ))}
            {extra > 0 && <span className="wk-stack-av wk-stack-av--more">+{extra}</span>}
          </span>
          <span className="text-[12px] font-semibold text-white/40">
            from {people.length} {people.length === 1 ? 'client' : 'clients'}
          </span>
        </div>
      )}
    </div>
  );
}