import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { displayNameOf } from '@/lib/profilePresets';
import PageShell from '@/components/shared/PageShell';
import SectionHeader from '@/components/shared/SectionHeader';
import Surface from '@/components/shared/Surface';

const PILLARS = [
  {
    icon: LinkIcon,
    title: 'A profile worth putting in your bio',
    desc: 'Your Stelli page is your portfolio, booking link, and credibility signal in one clean URL.',
  },
  {
    icon: BadgeCheck,
    title: 'A collective people want into',
    desc: 'Selected creators get a public profile and visibility inside the Stelli network.',
  },
  {
    icon: ShieldCheck,
    title: 'Book safely, not through DMs',
    desc: 'Stop chasing clients, getting ghosted, or eating bad checks. Payments are protected before the shoot starts.',
  },
];

export default function ForCreators() {
  // The sample profile is a real, approved creator — never a hardcoded name.
  const { data: sample } = useQuery({
    queryKey: ['for-creators-sample'],
    queryFn: async () => {
      const list = await base44.entities.Lensman.filter({ status: 'approved' }, '-created_date', 1);
      return list[0] || null;
    },
  });

  const sampleName = sample ? displayNameOf(sample) : 'A Stelli creator';

  return (
    <PageShell>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-14 lg:gap-16 items-start">
        <div>
          <SectionHeader
            eyebrow="For creators"
            title="Your next paying gig is one click away."
            intro="Stelli gives photographers and filmmakers a bio link that looks better than a DM — and books safer than one."
          />
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              to="/apply"
              className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 label-mono text-[11px] font-semibold transition-transform duration-300 hover:-translate-y-0.5"
              style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))' }}
            >
              Apply to join <ArrowRight className="w-4 h-4" />
            </Link>
            {sample && (
              <Link
                to={`/creators/${sample.slug || sample.id}`}
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-8 py-4 label-mono text-[11px] text-white/60 hover:text-white transition-colors"
              >
                View a sample profile
              </Link>
            )}
          </div>
        </div>

        <Surface className="p-6">
          <p className="label-mono text-[9px] text-white/35 mb-5">Bio link preview</p>
          <div className="aspect-[4/5] overflow-hidden rounded-[12px] bg-surface-2">
            <img
              src={sample?.profile_image || sample?.portfolio_images?.[0] || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=700&h=900&fit=crop&q=85'}
              alt="Creator profile preview"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="mt-5 text-[22px] font-semibold leading-none text-white">{sampleName}</p>
          <p className="mt-2 text-[13px] text-white/45">
            {sample?.profile_tagline || sample?.specialties?.slice(0, 3).join(' · ') || 'direct flash · nightlife · content days'}
          </p>
          <div className="mt-5 border-t border-white/10 pt-4 flex items-center justify-between">
            <span className="text-[12px] text-white/35">getstelli.com/creators/{sample?.slug || ''}</span>
            <span className="label-mono text-[9px] text-neon-lime">Book</span>
          </div>
        </Surface>
      </div>

      <section className="mt-20 md:mt-24 border-t border-white/10">
        {PILLARS.map((pillar) => (
          <div
            key={pillar.title}
            className="grid grid-cols-1 md:grid-cols-[56px_1fr_1fr] gap-5 md:gap-10 py-9 md:py-11 border-b border-white/10 items-start"
          >
            <span className="grid place-items-center w-10 h-10 rounded-full border border-white/10 text-neon-lime">
              <pillar.icon className="w-4 h-4" strokeWidth={1.6} />
            </span>
            <h2 className="text-[22px] md:text-[30px] font-semibold leading-tight text-white">{pillar.title}</h2>
            <p className="text-[14px] md:text-[15px] leading-relaxed text-white/45 max-w-md">{pillar.desc}</p>
          </div>
        ))}
      </section>

      <section className="mt-20 md:mt-24 text-center">
        <h2
          className="mx-auto max-w-[720px] font-semibold leading-[1] tracking-[-0.02em] text-white"
          style={{ fontSize: 'clamp(30px, 4.6vw, 56px)' }}
        >
          Stop sending clients to your DMs.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-white/45">
          Send them somewhere that makes you look booked, protected, and worth paying.
        </p>
        <Link
          to="/apply"
          className="mt-9 inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 label-mono text-[11px] font-semibold transition-transform duration-300 hover:-translate-y-0.5"
          style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))' }}
        >
          Apply to join Stelli <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </PageShell>
  );
}