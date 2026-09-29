import React from 'react';
import { PH, PROMPTS, activeTiers, orderedPortfolio } from '@/lib/wizardData';

function Tile({ item }) {
  if (item?.src) return <img src={item.src} alt="" />;
  return <div className="ph" style={{ background: PH[(item?.ph || 0) % PH.length] }} />;
}

const GALLERY_COUNT = { hero: 5, ordered: 6, contact: 8 };
const GALLERY_CLASS = { hero: 'g-hero', ordered: 'g-ordered', contact: 'g-contact' };

/** The creator's public page, exactly as the wizard shows it while they build. */
export default function WizardProfilePreview({ s }) {
  const ordered = orderedPortfolio(s);
  const tiers = activeTiers(s);
  const from = tiers.length ? Math.min(...tiers.map((tier) => Number(tier.price))) : null;
  const count = GALLERY_COUNT[s.gallery];
  const tiles = ordered.length
    ? ordered.slice(0, count)
    : Array.from({ length: count }, (_, i) => ({ ph: i }));
  const tags = s.tags.length ? s.tags.join(' · ') : 'your · style · tags';
  const initial = (s.name.trim()[0] || '?').toUpperCase();

  return (
    <div className={`profile theme-${s.theme} acc-${s.accent}`}>
      <div className="p-hero">
        <Tile item={ordered[0] || { ph: 0 }} />
      </div>

      <div className="p-id">
        <div className="p-ava">{s.photo ? <img src={s.photo} alt="" /> : initial}</div>
        <div className="p-name">{s.name.trim() || 'Your name'}</div>
        <div className="p-tags">{tags}</div>
        <div className="p-meta">
          Elon University · <span className="new">New on Stelli</span>
        </div>
        <div className="p-book">Request a date</div>
        <div className="p-from">{from != null ? `Packages from $${from}` : 'Add pricing to show packages'}</div>
      </div>

      {s.oneLiner.trim() && (
        <div className="p-section">
          <div className="p-oneliner">“{s.oneLiner.trim()}”</div>
        </div>
      )}

      {tiers.length > 0 && (
        <div className="p-section">
          <div className="p-sec-label">Packages</div>
          <div className="p-pkgs">
            {tiers.map((tier, i) => (
              <div key={`${tier.name}-${i}`} className={`p-pkg ${tier.level === 'mid' && tiers.length > 1 ? 'mid' : ''}`}>
                <div>
                  {tier.level === 'mid' && tiers.length > 1 && <span className="p-pop">Most booked</span>}
                  <div className="p-pkg-name">{tier.name.trim() || 'Package'}</div>
                  <div className="p-pkg-sub">
                    {tier.duration}
                    {tier.includes.trim() ? ` · ${tier.includes.trim()}` : ''}
                  </div>
                </div>
                <div className="p-pkg-price">${Number(tier.price)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-section">
        <div className="p-sec-label">Portfolio</div>
        <div className={`p-gallery ${GALLERY_CLASS[s.gallery]}`}>
          {tiles.map((item, i) => (
            <div key={i} className="g-tile" data-n={String(i + 1).padStart(2, '0')}>
              <Tile item={item} />
            </div>
          ))}
        </div>
      </div>

      {s.bio.trim() && (
        <div className="p-section">
          <div className="p-sec-label">About</div>
          <div className="p-body">{s.bio.trim()}</div>
        </div>
      )}

      {s.what.length > 0 && (
        <div className="p-section">
          <div className="p-sec-label">Shoots</div>
          <div className="p-chiprow">
            {s.what.map((item) => (
              <span key={item} className="p-chip">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {s.where.length > 0 && (
        <div className="p-section">
          <div className="p-sec-label">Shoots at</div>
          <div className="p-chiprow">
            {s.where.map((item) => (
              <span key={item} className="p-chip">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {(s.equip.trim() || s.years) && (
        <div className="p-section">
          <div className="p-sec-label">The kit</div>
          <div className="p-kv">
            {s.equip.trim() && (
              <div className="row">
                <span className="k">Equipment</span>
                <span>{s.equip.trim()}</span>
              </div>
            )}
            {s.years && (
              <div className="row">
                <span className="k">Years shooting</span>
                <span>{s.years}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {s.promptIdx != null && s.promptA.trim() && (
        <div className="p-section">
          <div className="p-prompt-q">{PROMPTS[s.promptIdx]}</div>
          <div className="p-body">{s.promptA.trim()}</div>
        </div>
      )}

      {s.dont.trim() && (
        <div className="p-section">
          <div className="p-sec-label">What I don't shoot</div>
          <div className="p-dont">{s.dont.trim()}</div>
        </div>
      )}
    </div>
  );
}