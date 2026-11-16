import React from 'react';
import { CHAPTERS, STEPS } from '@/lib/wizardData';

/**
 * Progress along the route, as dots that double as a way back. Grouped by
 * chapter, in the order the route takes them, so the short application route
 * shows only its own steps.
 */
export default function WizardChapters({ step, flow, maxPos, onJump }) {
  const current = STEPS[step].ch;

  // Consecutive steps of one chapter share a group.
  const groups = [];
  flow.forEach((index, pos) => {
    const ch = STEPS[index].ch;
    const last = groups[groups.length - 1];
    if (last && last.ch === ch) last.items.push({ index, pos });
    else groups.push({ ch, items: [{ index, pos }] });
  });

  return (
    <nav className="chapters" aria-label="Progress">
      {groups.map((group) => (
        <div key={`${group.ch}-${group.items[0].pos}`} className={`chap ${group.ch === current ? 'cur' : ''}`}>
          <span className="chap-label">{CHAPTERS[group.ch]}</span>
          <div className="chap-dots">
            {group.items.map(({ index, pos }) => {
              const can = pos <= maxPos && index !== step;
              return (
                <button
                  key={STEPS[index].key}
                  type="button"
                  className={`dot ${index === step ? 'now' : pos <= maxPos ? 'done' : ''}`}
                  onClick={can ? () => onJump(index) : undefined}
                  tabIndex={can ? 0 : -1}
                  aria-label={`Step ${pos + 1}: ${STEPS[index].title}`}
                />
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
