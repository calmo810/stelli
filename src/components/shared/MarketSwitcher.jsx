import React from 'react';
import { useMarket, MARKETS } from '@/lib/market';

export default function MarketSwitcher({ className = '' }) {
  const { market, setMarket } = useMarket();

  return (
    <div className={`inline-flex items-center border border-white/15 ${className}`} style={{ borderRadius: 4 }}>
      {MARKETS.map((m) => {
        const active = market === m.id;
        return (
          <button
            key={m.id}
            onClick={() => setMarket(m.id)}
            aria-pressed={active}
            className="label-mono px-3 py-2 text-[9px] transition-colors"
            style={{
              background: active ? 'hsl(var(--neon-lime))' : 'transparent',
              color: active ? 'hsl(var(--ink))' : 'hsl(var(--muted-tone))',
            }}
          >
            {m.short}
          </button>
        );
      })}
    </div>
  );
}