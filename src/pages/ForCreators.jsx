import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const pillars = [
  {
    icon: LinkIcon,
    title: 'A profile worth putting in your bio',
    desc: 'Your Stelli page is your portfolio, booking link, pricing menu, and credibility signal in one clean URL.',
  },
  {
    icon: BadgeCheck,
    title: 'A collective people want into',
    desc: 'Selected creators get the Constellation Collective badge, a public profile, and visibility inside the Stelli network.',
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

  const sampleName = sample?.display_name || sample?.full_name || 'A Stelli creator';

  return (
    <div className="min-h-screen" style={{ background: '#f0ede6' }}>
      {/* Hero */}
      <section className="px-8 md:px-14 pt-32 pb-24">
        <div className="max-w-[1180px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-16 items-end">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            <p className="text-[8px] font-body tracking-[0.5em] uppercase mb-8" style={{ color: 'rgba(26,39,68,0.3)' }}>
              For Creators
            </p>
            <h1 className="font-display font-semibold leading-[0.9] max-w-[820px]" style={{ fontSize: 'clamp(48px, 7vw, 104px)', color: '#1a2744' }}>
              Your next paying gig is one click away.
            </h1>
            <p className="font-body text-[14px] leading-relaxed mt-8 max-w-md" style={{ color: 'rgba(26,39,68,0.48)' }}>
              Stelli gives photographers and filmmakers a bio link that looks better than a DM — and books safer than one.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-10">
              <Link to="/apply" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-[10px] font-body tracking-[0.08em] uppercase font-semibold transition-all"
                style={{ background: '#1a2744', color: '#f0ede6' }}>
                Apply to join <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              {sample && (
                <Link to={`/creators/${sample.id}`} className="inline-flex items-center justify-center px-8 py-3.5 rounded-full border text-[10px] font-body tracking-[0.08em] uppercase transition-all"
                  style={{ borderColor: 'rgba(26,39,68,0.2)', color: 'rgba(26,39,68,0.55)' }}>
                  View sample profile
                </Link>
              )}
            </div>
          </motion.div>

          {/* Clean profile-link card */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.9 }}
            className="border p-6" style={{ background: '#ece9e2', borderColor: 'rgba(26,39,68,0.12)' }}>
            <p className="text-[7px] font-body tracking-[0.4em] uppercase mb-5" style={{ color: 'rgba(26,39,68,0.3)' }}>Bio link preview</p>
            <div className="aspect-[4/5] overflow-hidden mb-5" style={{ background: '#d8d3c8' }}>
              <img
                src={sample?.profile_image || sample?.portfolio_images?.[0] || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=700&h=900&fit=crop&q=85'}
                alt="Creator profile preview"
                className="w-full h-full object-cover"
                style={{ filter: 'contrast(1.04) saturate(0.82)' }}
              />
            </div>
            <p className="font-display font-semibold text-[26px] leading-none" style={{ color: '#1a2744' }}>{sampleName}</p>
            <p className="text-[11px] font-body mt-2 mb-5" style={{ color: 'rgba(26,39,68,0.45)' }}>
              {sample?.profile_tagline || sample?.specialties?.slice(0, 3).join(' · ') || 'direct flash · nightlife · content days'}
            </p>
            <div className="border-t pt-4 flex items-center justify-between" style={{ borderColor: 'rgba(26,39,68,0.1)' }}>
              <span className="text-[10px] font-body" style={{ color: 'rgba(26,39,68,0.4)' }}>getstelli.com/creators/{sample?.slug || ''}</span>
              <span className="text-[9px] font-body tracking-[0.12em] uppercase" style={{ color: '#1a2744' }}>Book</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pillars */}
      <section className="px-8 md:px-14 pb-24">
        <div className="max-w-[1180px] mx-auto border-t" style={{ borderColor: 'rgba(26,39,68,0.12)' }}>
          {pillars.map((p, i) => (
            <motion.div key={p.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
              className="grid grid-cols-1 md:grid-cols-[120px_1fr_1fr] gap-5 py-10 border-b items-start" style={{ borderColor: 'rgba(26,39,68,0.12)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(26,39,68,0.07)', color: '#1a2744' }}>
                <p.icon className="w-4 h-4" strokeWidth={1.6} />
              </div>
              <h2 className="font-display font-semibold leading-tight" style={{ fontSize: 'clamp(26px, 3vw, 44px)', color: '#1a2744' }}>{p.title}</h2>
              <p className="font-body text-[13px] leading-relaxed max-w-sm md:pt-2" style={{ color: 'rgba(26,39,68,0.45)' }}>{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 md:px-14 pb-28 text-center">
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto">
          <p className="text-[8px] font-body tracking-[0.5em] uppercase mb-6" style={{ color: 'rgba(26,39,68,0.28)' }}>Selective by design</p>
          <h2 className="font-display font-semibold leading-[0.92]" style={{ fontSize: 'clamp(34px, 5vw, 68px)', color: '#1a2744' }}>
            Stop sending clients to your DMs.
          </h2>
          <p className="font-body text-[13px] leading-relaxed mt-6 mb-10" style={{ color: 'rgba(26,39,68,0.42)' }}>
            Send them somewhere that makes you look booked, protected, and worth paying.
          </p>
          <Link to="/apply" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-[10px] font-body tracking-[0.08em] uppercase font-semibold transition-all"
            style={{ background: '#1a2744', color: '#f0ede6' }}>
            Apply to join Stelli <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}