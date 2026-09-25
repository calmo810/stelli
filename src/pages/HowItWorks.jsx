import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Users, Calendar, MessageCircle, CreditCard } from 'lucide-react';
import PageShell from '@/components/shared/PageShell';
import SectionHeader from '@/components/shared/SectionHeader';
import Surface from '@/components/shared/Surface';

const STEPS = [
  {
    icon: Users,
    title: 'Find your person',
    desc: 'Every creator on Stelli is reviewed before they go public. Browse portfolios and pick a style that matches what you are making.',
  },
  {
    icon: Calendar,
    title: 'Send a date',
    desc: 'One short form: when, where, and what the shoot is. Nothing to pay yet, no packages to choose.',
  },
  {
    icon: MessageCircle,
    title: 'Talk it through',
    desc: 'Your creator replies in the booking thread with a private quote and any questions. Shot lists, venue details, ideas — all in one place.',
  },
  {
    icon: CreditCard,
    title: 'Pay when you accept',
    desc: 'Accept the quote to lock the date. Your payment is held, and only released to the creator once your photos are delivered.',
  },
];

const PROMISES = [
  { title: 'Held payments', desc: 'Your money sits with Stelli until delivery, never with a stranger.' },
  { title: 'Vetted creators', desc: 'Portfolio review and reference checks before anyone is listed.' },
  { title: 'A deadline you can see', desc: 'Delivery dates live on the booking, and our team steps in if one slips.' },
];

export default function HowItWorks() {
  return (
    <PageShell width="narrow">
      <SectionHeader
        eyebrow="How Stelli works"
        title="Four steps, no mystery."
        intro="From the first message to the final gallery, every step happens in the same thread so nobody is left guessing what happens next."
      />

      <ol className="mt-16 md:mt-20 border-t border-white/10">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className="grid grid-cols-1 md:grid-cols-[64px_1fr_1fr] gap-5 md:gap-10 py-9 md:py-11 border-b border-white/10 items-start"
          >
            <span className="label-mono text-[11px] text-neon-lime pt-1">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h2 className="text-[22px] md:text-[28px] font-semibold leading-tight text-white">{step.title}</h2>
            <p className="text-[14px] md:text-[15px] leading-relaxed text-white/45 max-w-md">{step.desc}</p>
          </li>
        ))}
      </ol>

      <section className="mt-20 md:mt-24">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-4 h-4 text-neon-lime" strokeWidth={1.7} />
          <h2 className="label-mono text-[10px] text-white/45">What Stelli guarantees</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {PROMISES.map((item) => (
            <Surface key={item.title} className="p-6 md:p-7">
              <h3 className="text-[16px] font-semibold text-white">{item.title}</h3>
              <p className="mt-2.5 text-[14px] leading-relaxed text-white/45">{item.desc}</p>
            </Surface>
          ))}
        </div>
      </section>

      <section className="mt-20 md:mt-24 flex flex-col sm:flex-row gap-3">
        <Link
          to="/creators"
          className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 label-mono text-[11px] font-semibold transition-transform duration-300 hover:-translate-y-0.5"
          style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))' }}
        >
          Browse creators <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/faq"
          className="inline-flex items-center justify-center rounded-full border border-white/15 px-8 py-4 label-mono text-[11px] text-white/60 hover:text-white transition-colors"
        >
          Read the FAQ
        </Link>
      </section>
    </PageShell>
  );
}