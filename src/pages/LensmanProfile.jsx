import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BadgeCheck, ShieldCheck, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

const PROFILES = {
  calvin: {
    slug: 'calvin', full_name: 'Calvin Monfried', display_name: 'Calvin',
    bio: 'Downtown New York. Direct flash, available light, real people mid-motion. I shoot the night the way it actually felt — not the way it looked on the way in.',
    neighborhoods: ['Williamsburg', 'LES', 'Bushwick'], specialties: ['Birthdays', 'Music Videos', 'Events', 'Content Days'], style_tags: ['direct flash', 'documentary', 'candid', 'night'], years_experience: 6, avg_rating: 5.0, review_count: 24, rate_half_day: 800, rate_full_day: 1400,
    portfolio_images: ['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=900&h=1100&fit=crop&q=88','https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=900&h=1100&fit=crop&q=88','https://images.unsplash.com/photo-1524593166156-312f362cada0?w=900&h=1100&fit=crop&q=88','https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&h=1100&fit=crop&q=88','https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&h=1100&fit=crop&q=88','https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=900&h=1100&fit=crop&q=88'],
    profile_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=900&h=1100&fit=crop&q=88',
  },
  wyatt: {
    slug: 'wyatt', full_name: 'Wyatt Trundle', display_name: 'Wyatt',
    bio: 'I move between film and digital depending on the light. Portraits, parties, content. I show up early and leave when it gets good.',
    neighborhoods: ['West Village', 'SoHo', 'DUMBO', 'Chelsea'], specialties: ['Portraits', 'Content Days', 'Restaurant Launches', 'Proposals'], style_tags: ['film', 'editorial', 'portrait', 'day'], years_experience: 4, avg_rating: 4.9, review_count: 17, rate_half_day: 750, rate_full_day: 1300,
    portfolio_images: ['https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&h=1100&fit=crop&q=88','https://images.unsplash.com/photo-1524593166156-312f362cada0?w=900&h=1100&fit=crop&q=88','https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=900&h=1100&fit=crop&q=88','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&h=1100&fit=crop&q=88','https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&h=1100&fit=crop&q=88','https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=900&h=1100&fit=crop&q=88'],
    profile_image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&h=1100&fit=crop&q=88',
  },
};

function slugifyName(name = '') {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function LensmanProfile() {
  const { id } = useParams();

  const { data: dbLensman, isLoading } = useQuery({
    queryKey: ['lensman', id],
    queryFn: async () => {
      const byId = await base44.entities.Lensman.filter({ id });
      if (byId[0]) return byId[0];
      const all = await base44.entities.Lensman.filter({ status: 'approved' });
      return all.find(l => slugifyName(l.display_name || l.full_name) === id) || null;
    },
  });

  const lensman = dbLensman || PROFILES[id] || null;

  if (isLoading) {
    return <div className="min-h-screen px-8 md:px-14 py-28" style={{ background: '#f0ede6' }}><Skeleton className="h-12 w-72 mb-8" /><Skeleton className="h-[480px] w-full" /></div>;
  }

  if (!lensman) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0ede6' }}>
        <div className="text-center">
          <p className="font-display text-3xl mb-4" style={{ color: '#1a2744' }}>Creator not found</p>
          <Link to="/browse" className="text-[10px] font-body tracking-[0.1em] uppercase border-b pb-px" style={{ color: 'rgba(26,39,68,0.45)', borderColor: 'rgba(26,39,68,0.2)' }}>Back to the collective</Link>
        </div>
      </div>
    );
  }

  const bookingId = dbLensman?.id || id;
  const displayName = lensman.display_name || lensman.full_name;
  const images = lensman.portfolio_images || [];
  const packages = [
    lensman.rate_half_day && { name: 'The Moment', desc: '4-hour shoot · edited gallery · digital delivery', price: lensman.rate_half_day, type: 'half_day' },
    lensman.rate_full_day && { name: 'The Full Day', desc: '8-hour shoot · photo + video package', price: lensman.rate_full_day, type: 'full_day' },
    lensman.rate_custom && { name: 'Custom', desc: lensman.custom_package_description || 'Built around your brief', price: lensman.rate_custom, type: 'custom' },
  ].filter(Boolean);

  return (
    <div className="min-h-screen" style={{ background: '#f0ede6' }}>
      <section className="px-8 md:px-14 pt-28 pb-12 max-w-[1400px] mx-auto">
        <Link to="/browse" className="inline-flex items-center gap-2 text-[10px] font-body tracking-[0.1em] uppercase mb-14" style={{ color: 'rgba(26,39,68,0.35)' }}>
          <ArrowLeft className="w-3 h-3" /> The Collective
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 items-end border-b pb-12" style={{ borderColor: 'rgba(26,39,68,0.12)' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            <p className="text-[8px] font-body tracking-[0.5em] uppercase mb-6 flex items-center gap-3" style={{ color: 'rgba(26,39,68,0.3)' }}>
              <span className="w-6 h-px inline-block" style={{ background: 'rgba(26,39,68,0.25)' }} />
              Constellation Collective
            </p>
            <h1 className="font-display font-semibold leading-[0.86]" style={{ fontSize: 'clamp(72px, 13vw, 180px)', color: '#1a2744' }}>
              {displayName}
            </h1>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25, duration: 0.8 }}>
            <div className="flex items-center gap-2 mb-5">
              <BadgeCheck className="w-4 h-4" style={{ color: '#1a2744' }} />
              <span className="text-[9px] font-body tracking-[0.22em] uppercase" style={{ color: 'rgba(26,39,68,0.45)' }}>Verified Stelli Creator</span>
            </div>
            <p className="font-body text-[14px] leading-relaxed mb-6" style={{ color: 'rgba(26,39,68,0.52)' }}>{lensman.bio}</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {lensman.specialties?.map((s, i) => (
                <span key={i} className="text-[9px] font-body tracking-[0.16em] uppercase px-3 py-1 border" style={{ borderColor: 'rgba(26,39,68,0.16)', color: 'rgba(26,39,68,0.45)' }}>{s}</span>
              ))}
            </div>
            <div className="flex items-center gap-4 text-[11px] font-body" style={{ color: 'rgba(26,39,68,0.36)' }}>
              <span>{lensman.neighborhoods?.slice(0, 2).join(' · ')}</span><span>·</span><span>{lensman.years_experience}+ yrs</span><span>·</span><span>★ {lensman.avg_rating?.toFixed(1) || '5.0'}</span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-8 md:px-14 pb-20 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
          {images.slice(0, 6).map((img, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
              className={`${i === 0 ? 'col-span-2 row-span-2 h-[520px]' : 'h-[256px]'} relative overflow-hidden`}>
              <img src={img} alt={`${displayName} work ${i + 1}`} className="w-full h-full object-cover" style={{ filter: 'contrast(1.03) saturate(0.86)' }} />
              <div className="absolute bottom-3 left-3 text-[7px] font-body tracking-[0.25em] uppercase text-white/55">Frame {String(i + 1).padStart(2, '0')}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-8 md:px-14 pb-28 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-14 items-start">
          <div>
            <p className="text-[8px] font-body tracking-[0.5em] uppercase mb-8" style={{ color: 'rgba(26,39,68,0.3)' }}>Book {displayName}</p>
            <div className="border-t" style={{ borderColor: 'rgba(26,39,68,0.12)' }}>
              {packages.map((pkg) => (
                <div key={pkg.type} className="flex items-center justify-between gap-6 py-6 border-b" style={{ borderColor: 'rgba(26,39,68,0.12)' }}>
                  <div>
                    <p className="font-display text-[26px] font-semibold" style={{ color: '#1a2744' }}>{pkg.name}</p>
                    <p className="text-[12px] font-body mt-1" style={{ color: 'rgba(26,39,68,0.4)' }}>{pkg.desc}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display text-[24px] font-semibold" style={{ color: '#1a2744' }}>${pkg.price}</p>
                    <Link to={`/book/${bookingId}?package=${pkg.type}`} className="text-[9px] font-body tracking-[0.1em] uppercase border-b pb-px" style={{ color: 'rgba(26,39,68,0.45)', borderColor: 'rgba(26,39,68,0.2)' }}>Book this →</Link>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-5">
              {['Payment protected before the shoot', 'Edited gallery included', 'Book without chasing DMs'].map(t => (
                <span key={t} className="flex items-center gap-2 text-[10px] font-body" style={{ color: 'rgba(26,39,68,0.36)' }}>
                  <span className="w-3 h-px inline-block" style={{ background: 'rgba(26,39,68,0.25)' }} />{t}
                </span>
              ))}
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 border p-7" style={{ background: '#ece9e2', borderColor: 'rgba(26,39,68,0.12)' }}>
            <p className="text-[7px] font-body tracking-[0.4em] uppercase mb-5" style={{ color: 'rgba(26,39,68,0.3)' }}>Bio link</p>
            <p className="font-display text-[28px] font-semibold leading-none mb-2" style={{ color: '#1a2744' }}>{displayName}</p>
            <p className="text-[11px] font-body mb-6" style={{ color: 'rgba(26,39,68,0.38)' }}>getstelli.com/creators/{lensman.slug || slugifyName(displayName)}</p>
            <div className="flex items-center gap-2 mb-6 pb-5 border-b" style={{ borderColor: 'rgba(26,39,68,0.1)' }}>
              <Star className="w-4 h-4 fill-current" style={{ color: '#1a2744' }} />
              <span className="text-[12px] font-body" style={{ color: '#1a2744' }}>{lensman.avg_rating?.toFixed(1) || '5.0'}</span>
              <span className="text-[11px] font-body" style={{ color: 'rgba(26,39,68,0.35)' }}>({lensman.review_count || 0} reviews)</span>
            </div>
            <Link to={`/book/${bookingId}`} className="block w-full text-center py-3.5 rounded-full text-[11px] font-body tracking-[0.08em] uppercase font-semibold" style={{ background: '#1a2744', color: '#f0ede6' }}>Book safely through Stelli</Link>
            <div className="flex items-start gap-3 mt-5">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'rgba(26,39,68,0.45)' }} />
              <p className="text-[11px] font-body leading-relaxed" style={{ color: 'rgba(26,39,68,0.38)' }}>Payment is held before the shoot and released after delivery.</p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}