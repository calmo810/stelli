import React from 'react';
import { Check } from 'lucide-react';

const CYAN = 'hsl(var(--neon-cyan))';

/**
 * What is still missing from a profile, with a bar that fills as it is done.
 * Each outstanding item scrolls to the field that fixes it.
 */
export default function ProfileChecklist({ items, pending }) {
  const done = items.filter((item) => item.done).length;
  const percent = Math.round((done / items.length) * 100);
  const outstanding = items.filter((item) => !item.done);

  return (
    <section
      className="border p-6"
      style={{ background: 'hsl(var(--surface))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 4 }}
    >
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <p className="label-mono text-[9px] text-white/40">Your profile</p>
        <p className="label-mono text-[9px] text-white/40">
          {done} of {items.length}
        </p>
      </div>

      <div className="h-1.5 w-full mb-5" style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 999 }}>
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${percent}%`, background: CYAN, borderRadius: 999 }}
        />
      </div>

      {outstanding.length === 0 ? (
        <p className="font-body text-[13px] text-white/70">Your profile is complete.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {outstanding.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => document.getElementById(item.key)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                className="label-mono text-[9px] px-3 py-2 border transition-colors hover:bg-white/5"
                style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', borderRadius: 999 }}
              >
                {item.label}
              </button>
            ))}
          </div>
          {pending && (
            <p className="font-body text-[12px] text-white/50 mt-4">
              Finish these and we'll review you sooner.
            </p>
          )}
        </>
      )}

      {outstanding.length === 0 && (
        <p className="label-mono text-[9px] mt-4 inline-flex items-center gap-2" style={{ color: CYAN }}>
          <Check className="w-3 h-3" /> All set
        </p>
      )}
    </section>
  );
}