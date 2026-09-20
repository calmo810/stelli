import React, { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'stelli.market';

export const MARKETS = [
  {
    id: 'NYC',
    label: 'New York City',
    short: 'NYC',
    blurb: 'Events, editorial, content days.',
  },
  {
    id: 'ELON',
    label: 'Elon, NC',
    short: 'ELON',
    blurb: 'Elon University senior portraits and campus shoots.',
  },
];

const MarketContext = createContext(null);

export function MarketProvider({ children }) {
  const [market, setMarket] = useState(() => {
    if (typeof window === 'undefined') return 'NYC';
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'ELON' ? 'ELON' : 'NYC';
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, market);
  }, [market]);

  const value = {
    market,
    setMarket,
    toggleMarket: () => setMarket((m) => (m === 'NYC' ? 'ELON' : 'NYC')),
    activeMarket: MARKETS.find((m) => m.id === market) || MARKETS[0],
  };

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket() {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error('useMarket must be used inside MarketProvider');
  return ctx;
}

/** Filters creators to the active market, falling back to the full list when a market has no creators yet. */
export function filterByMarket(creators, market) {
  const scoped = (creators || []).filter((c) => c.market === market);
  return scoped.length > 0 ? scoped : (creators || []);
}