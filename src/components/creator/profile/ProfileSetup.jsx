import React from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';

/** The short, plain list of what still stands between you and a booking. Tap a line to fix it. */
export default function ProfileSetup({ profile }) {
  const photos = profile.portfolio_images || [];
  const packages = profile.pricing_tiers || [];
  const area = profile.neighborhoods || [];

  const items = [
    {
      label: 'Photos',
      done: photos.length > 0,
      value: `${photos.length} photo${photos.length === 1 ? '' : 's'} up`,
      hint: 'Add the work you want to be booked for',
      to: '/edit-profile',
    },
    {
      label: 'About you',
      done: Boolean(profile.bio),
      value: 'Written',
      hint: 'A short line on how you shoot',
      to: '/edit-profile',
    },
    {
      label: 'Packages',
      done: packages.length > 0,
      value: `${packages.length} package${packages.length === 1 ? '' : 's'}`,
      hint: 'Give clients a place to start',
      to: '/edit-profile',
    },
    {
      label: 'Where you shoot',
      done: area.length > 0,
      value: area.join(', '),
      hint: 'Campuses and spots you work',
      to: '/edit-profile',
    },
  ];

  const ready = items.filter((item) => item.done).length;

  return (
    <section className="wk-card wk-card--pad">
      <div className="flex items-baseline justify-between gap-3">
        <p className="wk-label">Finish your storefront</p>
        <span className="text-[12px] font-bold wk-grey">
          {ready} of {items.length}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-black/5"
          >
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                item.done ? 'bg-neon-lime text-ink' : 'bg-black/5 text-[#0a1730]/35'
              }`}
            >
              {item.done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
            </span>
            <span className="min-w-0 flex-1">
              <b className="block text-[14.5px] font-bold text-ink">{item.label}</b>
              <small className="mt-0.5 block truncate text-[12.5px] wk-grey">
                {item.done ? item.value : item.hint}
              </small>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 wk-mute" strokeWidth={2.4} />
          </Link>
        ))}
      </div>
    </section>
  );
}