import React from 'react';
import { LIMITS, TIER_LEVELS } from '@/lib/creatorProfile';
import DurationPicker from '@/components/wizard/DurationPicker';

export default function StepPricing({ w }) {
  const setTier = (index, changes) => {
    w.patch({ tiers: w.s.tiers.map((tier, i) => (i === index ? { ...tier, ...changes } : tier)) });
  };

  return (
    <>
      <div className="tiers">
        {w.s.tiers.map((tier, i) => {
          const level = TIER_LEVELS[i];
          return (
            <div key={level.k} className={`tier ${tier.on ? '' : 'off'}`}>
              <div className="tier-head">
                <div className="tier-level">
                  <span className="sig">
                    {[8, 12, 16].map((height, bar) => (
                      <i key={bar} className={bar <= i ? '' : 'off'} style={{ height }} />
                    ))}
                  </span>
                  <span className="lvl">{level.label} tier</span>
                </div>
                <button
                  type="button"
                  className={`switch ${tier.on ? 'on' : ''}`}
                  role="switch"
                  aria-checked={tier.on}
                  aria-label={`Offer ${level.label} tier`}
                  onClick={() => setTier(i, { on: !tier.on })}
                />
              </div>

              <div className="tier-fields">
                <div className="nm">
                  <span className="mini-lbl">Package name</span>
                  <input
                    className="inp"
                    value={tier.name}
                    maxLength={LIMITS.tier_name}
                    placeholder="Package name"
                    onChange={(event) => setTier(i, { name: event.target.value })}
                  />
                </div>
                <div>
                  <span className="mini-lbl">Price</span>
                  <div className="prefix-wrap">
                    <span className="pre">$</span>
                    <input
                      className="inp"
                      inputMode="numeric"
                      maxLength={5}
                      value={tier.price}
                      placeholder="0"
                      onChange={(event) => setTier(i, { price: event.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                </div>
                <div>
                  <span className="mini-lbl">Length</span>
                  <DurationPicker
                    value={tier.duration}
                    onChange={(duration) => setTier(i, { duration })}
                  />
                </div>
                <div className="full">
                  <span className="mini-lbl">What's included</span>
                  <input
                    className="inp"
                    maxLength={LIMITS.tier_includes}
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
      <p className="hint">
        Turn off any tier you don't want to offer. Packages are your own starting point for quotes: clients never see
        them on your page.{w.existing ? '' : ' At least one priced package is needed to publish.'}
      </p>
    </>
  );
}