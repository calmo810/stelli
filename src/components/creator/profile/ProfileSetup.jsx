import React from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';
import { storefrontChecklist } from '@/lib/creatorProfile';

/**
 * The short, plain list of what still stands between you and a booking. It is
 * read from the saved profile with the same rules the wizard publishes by, and
 * each line opens the wizard on the step that fixes it.
 */
export default function ProfileSetup({ profile }) {
  const items = storefrontChecklist(profile);
  const ready = items.filter((item) => item.done).length;
  const allDone = ready === items.length;

  return (
    <section className="wk-card wk-card--pad" aria-labelledby="storefront-setup">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="storefront-setup" className="wk-label">{allDone ? 'Your storefront' : 'Finish your storefront'}</h2>
        <span className="text-[12px] font-bold wk-grey">
          {ready} of {items.length}
        </span>
      </div>

      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              to={`/edit-profile?step=${item.step}`}
              className="flex min-h-[52px] items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-black/5"
            >
              <span
                aria-hidden
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                  item.done ? 'bg-neon-lime text-ink' : 'bg-black/5 text-[#0a1730]/35'
                }`}
              >
                {item.done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
              </span>
              <span className="min-w-0 flex-1">
                <b className="block text-[14.5px] font-bold text-ink">
                  {item.label}
                  <span className="sr-only">{item.done ? ', done' : ', to do'}</span>
                </b>
                <small className="mt-0.5 block truncate text-[12.5px] wk-grey">
                  {item.done ? item.value : item.hint}
                </small>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 wk-mute" strokeWidth={2.4} aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
