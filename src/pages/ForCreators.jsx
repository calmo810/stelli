import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { displayNameOf } from '@/lib/profilePresets';

const pillars = [
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
    <div className="min-h-screen bg-ink">
      <section className="px-5 md:px-14 pt-32 pb-24">
        <div className="max-w-[1180px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-16 items-end">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            <p className="label-mono text-[9px] text-white/35 mb-8">For Creators</p>
            <h1 className="font-heading font-semibold leading-[0.9] max-w-[820px] text-white" style={{ fontSize: 'clamp(48px, 7vw, 104px)' }}>
              Your next paying gig is one click away.
            </h1>
            <p className="font-body text-[14px] leading-relaxed mt-8 max-w-md text-white/50">
              Stelli gives photographers and filmmakers a bio link that looks better than a DM — and books safer than one.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-10">
              <Link
                to="/apply"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 label-mono text-[10px] font-semibold transition-transform hover:-translate-y-0.5"
                style={{ background: '#2AE8F8', color: '#0a0f1e', borderRadius: 4 }}
              >
                Apply to join <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              {sample && (
                <Link
                  to={`/creators/${sample.slug || sample.id}`}
                  className="inline-flex items-center justify-center px-8 py-3.5 border label-mono text-[10px] text-white/60 hover:text-white transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.15)', borderRadius: 4 }}
                >
                  View sample profile
                </Link>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.9 }}
            className="border p-6"
            style={{ background: 'hsl(var(--surface))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 4 }}
          >
            <p className="label-mono text-[8px] text-white/30 mb-5">Bio link preview</p>
            <div className="aspect-[4/5] overflow-hidden mb-5" style={{ background: 'hsl(var(--surface-2))' }}>
              <img
                src={sample?.profile_image || sample?.portfolio_images?.[0] || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=700&h=900&fit=crop&q=85'}
                alt="Creator profile preview"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="font-heading font-semibold text-[26px] leading-none text-white">{sampleName}</p>
            <p className="font-body text-[11px] mt-2 mb-5 text-white/50">
              {sample?.profile_tagline || sample?.specialties?.slice(0, 3).join(' · ') || 'direct flash · nightlife · content days'}
            </p>
            <div className="border-t border-white/10 pt-4 flex items-center justify-between">
              <span className="font-body text-[10px] text-white/40">getstelli.com/creators/{sample?.slug || ''}</span>
              <span className="label-mono text-[9px] text-white/70">Book</span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-5 md:px-14 pb-24">
        <div className="max-w-[1180px] mx-auto border-t border-white/10">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="grid grid-cols-1 md:grid-cols-[120px_1fr_1fr] gap-5 py-10 border-b border-white/10 items-start"
            >
              <div className="w-10 h-10 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.07)', color: 'hsl(var(--neon-cyan))', borderRadius: 999 }}>
                <p.icon className="w-4 h-4" strokeWidth={1.6} />
              </div>
              <h2 className="font-heading font-semibold leading-tight text-white" style={{ fontSize: 'clamp(26px, 3vw, 44px)' }}>{p.title}</h2>
              <p className="font-body text-[13px] leading-relaxed max-w-sm md:pt-2 text-white/50">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-5 md:px-14 pb-28 text-center">
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto">
          <p className="label-mono text-[9px] text-white/30 mb-6">Selective by design</p>
          <h2 className="font-heading font-semibold leading-[0.92] text-white" style={{ fontSize: 'clamp(34px, 5vw, 68px)' }}>
            Stop sending clients to your DMs.
          </h2>
          <p className="font-body text-[13px] leading-relaxed mt-6 mb-10 text-white/45">
            Send them somewhere that makes you look booked, protected, and worth paying.
          </p>
          <Link
            to="/apply"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 label-mono text-[10px] font-semibold transition-transform hover:-translate-y-0.5"
            style={{ background: '#2AE8F8', color: '#0a0f1e', borderRadius: 4 }}
          >
            Apply to join Stelli <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}