import React from 'react';
import BackButton from '@/components/shared/BackButton';

const FAQS = [
  {
    q: 'How does pricing work?',
    a: 'Every shoot is quoted privately by the creator once you send a request. You will never see a price tag on a profile — creators price the actual work, not a template.',
  },
  {
    q: 'Is "The Candid" a good first shoot?',
    a: 'The Candid is built to be an easy yes — a short, fast shoot that gets you real photos without committing a whole day.',
  },
  {
    q: 'When does my creator get paid?',
    a: 'Your payment is held when you accept a quote and only released to the creator after your photos are delivered.',
  },
  {
    q: 'How do I get my photos?',
    a: 'Creators deliver through their own gallery service. Once your payment has cleared, your delivery link appears on the booking in your portal and arrives by email.',
  },
  {
    q: 'When do I see my creator\'s contact details?',
    a: 'Contact details stay hidden until a booking is confirmed, so requests stay on-platform and both sides are protected.',
  },
  {
    q: 'Can I book a creator for another city?',
    a: 'Stelli runs in New York City and Elon, North Carolina. Switch markets in the menu to see creators near you.',
  },
  {
    q: 'Can I cancel?',
    a: 'Yes. Cancellation terms depend on how close you are to the shoot date, and they are spelled out in your booking agreement before you accept a quote.',
  },
];

export default function Faq() {
  return (
    <div className="min-h-screen bg-ink">
      <BackButton />
      <section className="max-w-3xl mx-auto px-5 md:px-10 pt-32 pb-24">
        <p className="label-mono text-[9px] text-white/35 mb-5">Stelli · FAQ</p>
        <h1 className="font-heading font-semibold text-white leading-[0.95] mb-6" style={{ fontSize: 'clamp(40px, 7vw, 84px)' }}>
          Questions,<br />answered.
        </h1>
        <p className="font-body text-[14px] leading-relaxed text-white/45 max-w-lg mb-16">
          Everything about booking, quoting, payment, and getting your photos.
        </p>

        <div className="space-y-px" style={{ background: 'rgba(255,255,255,0.08)' }}>
          {FAQS.map((item) => (
            <details key={item.q} className="group p-6 md:p-8" style={{ background: 'hsl(var(--ink))' }}>
              <summary className="cursor-pointer list-none flex items-start justify-between gap-6">
                <h2 className="font-heading text-[19px] md:text-[23px] font-semibold text-white group-hover:text-neon-lime transition-colors">
                  {item.q}
                </h2>
                <span className="font-mono text-[16px] shrink-0 mt-1" style={{ color: 'hsl(var(--neon-lime))' }}>+</span>
              </summary>
              <p className="font-body text-[13px] md:text-[14px] leading-relaxed text-white/50 mt-4 max-w-2xl">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}