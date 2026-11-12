import React from 'react';
import { DURATIONS, TIER_LEVELS } from '@/lib/creatorProfile';

/** Up to three packages to quote from. Private: clients get a quote, not a price list. */
export default function PackagesSection({ form, set }) {
  const setTier = (index, changes) =>
    set({ tiers: form.tiers.map((tier, i) => (i === index ? { ...tier, ...changes } : tier)) });

  return (
    <div>
      {form.tiers.map((tier, i) => {
        const level = TIER_LEVELS[i];
        return (
          <div key={level.k} className={`cf-tier ${tier.on ? '' : 'is-off'}`}>
            <div className="cf-tier__head">
              <span>{tier.on && tier.name.trim() ? tier.name : `${level.label} package`}</span>
              <button
                type="button"
                role="switch"
                aria-checked={tier.on}
                aria-label={`Offer the ${level.label.toLowerCase()} package`}
                className={`cf-toggle ${tier.on ? 'is-on' : ''}`}
                onClick={() => setTier(i, { on: !tier.on })}
              />
            </div>

            <div className="cf-tier__fields">
              <div>
                <label className="cf-label" htmlFor={`cfTierName${i}`}>
                  <span>Name</span>
                </label>
                <input
                  id={`cfTierName${i}`}
                  className="cf-input"
                  maxLength={28}
                  value={tier.name}
                  onChange={(event) => setTier(i, { name: event.target.value })}
                />
              </div>
              <div>
                <label className="cf-label" htmlFor={`cfTierPrice${i}`}>
                  <span>Price</span>
                </label>
                <div className="cf-prefix">
                  <span>$</span>
                  <input
                    id={`cfTierPrice${i}`}
                    className="cf-input"
                    inputMode="numeric"
                    maxLength={5}
                    value={tier.price}
                    placeholder="0"
                    onChange={(event) => setTier(i, { price: event.target.value.replace(/\D/g, '') })}
                  />
                </div>
              </div>
              <div>
                <label className="cf-label" htmlFor={`cfTierLen${i}`}>
                  <span>Length</span>
                </label>
                <select
                  id={`cfTierLen${i}`}
                  className="cf-input"
                  value={tier.duration}
                  onChange={(event) => setTier(i, { duration: event.target.value })}
                >
                  {DURATIONS.map((duration) => (
                    <option key={duration} value={duration}>
                      {duration}
                    </option>
                  ))}
                </select>
              </div>
              <div className="is-full">
                <label className="cf-label" htmlFor={`cfTierInc${i}`}>
                  <span>What's included</span>
                </label>
                <input
                  id={`cfTierInc${i}`}
                  className="cf-input"
                  maxLength={60}
                  value={tier.includes}
                  placeholder="e.g. 15 edited photos, 1 location"
                  onChange={(event) => setTier(i, { includes: event.target.value })}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
