import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const PREF_KEY = 'stelli_portal_ai';

const readPref = () => {
  try {
    return localStorage.getItem(PREF_KEY) !== 'off';
  } catch {
    return true;
  }
};

/** The plain list: what changed, one line each. */
function PlainList({ items }) {
  return (
    <ul className="mt-1 divide-y divide-[rgba(10,18,38,0.12)]">
      {items.map((item) => (
        <li key={item.key}>
          <Link to={item.to} className="flex items-center gap-2 py-2 text-[14px] font-semibold wk-ink">
            <span className="min-w-0 flex-1">{item.label}</span>
            <span aria-hidden className="wk-mute">→</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * The small note at the top of Today. The AI summary is optional: switched off,
 * the card shows the same things as a plain list.
 */
export default function WhatsNewCard({ items = [], facts = [] }) {
  const [aiOn, setAiOn] = useState(readPref);

  const toggle = () => {
    const next = !aiOn;
    setAiOn(next);
    try {
      localStorage.setItem(PREF_KEY, next ? 'on' : 'off');
    } catch {
      // A browser that blocks storage just forgets the choice.
    }
  };

  const { data: summary, isLoading } = useQuery({
    queryKey: ['creator-whats-new', facts.join('|')],
    enabled: aiOn && facts.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      const response = await base44.functions.invoke('summarizeCreatorUpdates', { facts });
      return response.data?.summary || null;
    },
  });

  if (!items.length) return null;

  return (
    <section className="wk-card wk-card--lime wk-card--pad">
      <div className="flex items-center justify-between gap-3">
        <p className="wk-label">
          <Sparkles className="h-3 w-3" strokeWidth={2.4} /> What&apos;s new
        </p>
        <button
          type="button"
          role="switch"
          aria-checked={aiOn}
          aria-label="Summarise with AI"
          onClick={toggle}
          className={`wk-switch ${aiOn ? 'is-on' : ''}`}
        >
          <span>AI</span>
          <span className="wk-switch-track">
            <span className="wk-switch-thumb" />
          </span>
        </button>
      </div>

      {aiOn && isLoading ? (
        <div className="mt-3 space-y-2">
          <span className="wk-fill block h-3.5 w-[86%] animate-pulse rounded-full" />
          <span className="wk-fill block h-3.5 w-[62%] animate-pulse rounded-full" />
        </div>
      ) : aiOn && summary ? (
        <p className="wk-summary mt-2.5">{summary}</p>
      ) : (
        <PlainList items={items} />
      )}
    </section>
  );
}