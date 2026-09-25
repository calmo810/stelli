import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PageShell from '@/components/shared/PageShell';
import SectionHeader from '@/components/shared/SectionHeader';

const FAQS = [
  {
    q: 'How does pricing work?',
    a: 'Every shoot is quoted privately by the creator once you send a request. You will never see a price tag on a profile — creators price the actual work, not a template.',
  },
  {
    q: 'What can I book?',
    a: "Anything a photographer or filmmaker can shoot. Send a date, tell them what you're planning, and they'll quote it.",
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
    q: "When do I see my creator's contact details?",
    a: 'Contact details stay hidden until a booking is confirmed, so requests stay on-platform and both sides are protected.',
  },
  {
    q: 'Where does Stelli run?',
    a: 'Stelli runs in Elon, North Carolina — campus and the neighborhoods around it. More markets are coming.',
  },
  {
    q: 'Can I cancel?',
    a: 'Yes. Cancellation terms depend on how close you are to the shoot date, and they are spelled out in your booking agreement before you accept a quote.',
  },
];

export default function Faq() {
  return (
    <PageShell width="reading">
      <SectionHeader
        eyebrow="Stelli · FAQ"
        title="Questions, answered."
        intro="Everything about booking, quoting, payment, and getting your photos."
      />

      <div className="mt-14 md:mt-16 border-t border-white/10">
        {FAQS.map((item) => (
          <details key={item.q} className="group border-b border-white/10 py-6 md:py-7">
            <summary className="cursor-pointer list-none flex items-start justify-between gap-6">
              <h2 className="text-[17px] md:text-[20px] font-semibold leading-snug text-white group-hover:text-neon-lime transition-colors">
                {item.q}
              </h2>
              <Plus
                aria-hidden
                className="w-4 h-4 shrink-0 mt-1.5 text-neon-lime transition-transform duration-300 group-open:rotate-45"
              />
            </summary>
            <p className="mt-4 max-w-2xl text-[14px] md:text-[15px] leading-relaxed text-white/45">{item.a}</p>
          </details>
        ))}
      </div>

      <p className="mt-12 text-[14px] text-white/40">
        Something else on your mind?{' '}
        <Link to="/creators" className="text-neon-lime hover:underline underline-offset-4">
          Browse creators
        </Link>{' '}
        or read the{' '}
        <Link to="/terms" className="text-neon-lime hover:underline underline-offset-4">
          terms
        </Link>
        .
      </p>
    </PageShell>
  );
}