import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import ReviewsList from '../components/profile/ReviewsList';
import { Skeleton } from '@/components/ui/skeleton';

// Hardcoded profiles for Calvin and Wyatt
const PROFILES = {
  calvin: {
    slug: 'calvin',
    full_name: 'Calvin Monfried',
    display_name: 'Calvin',
    bio: 'Downtown New York. Direct flash, available light, real people mid-motion. I shoot the night the way it actually felt — not the way it looked on the way in.',
    neighborhoods: ['Williamsburg', 'LES', 'Bushwick'],
    specialties: ['Birthdays', 'Music Videos', 'Events', 'Content Days'],
    style_tags: ['direct flash', 'documentary', 'candid', 'night'],
    years_experience: 6,
    avg_rating: 5.0,
    review_count: 24,
    rate_half_day: 800,
    rate_full_day: 1400,
    portfolio_images: [
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=1000&fit=crop&q=88',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=1000&fit=crop&q=88',
      'https://images.unsplash.com/photo-1524593166156-312f362cada0?w=800&h=1000&fit=crop&q=88',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=1000&fit=crop&q=88',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=1000&fit=crop&q=88',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=1000&fit=crop&q=88',
    ],
    profile_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop&q=88',
  },
  wyatt: {
    slug: 'wyatt',
    full_name: 'Wyatt Trundle',
    display_name: 'Wyatt',
    bio: 'I move between film and digital depending on the light. Portraits, parties, content. I show up early and leave when it gets good.',
    neighborhoods: ['West Village', 'SoHo', 'DUMBO', 'Chelsea'],
    specialties: ['Portraits', 'Content Days', 'Restaurant Launches', 'Proposals'],
    style_tags: ['film', 'editorial', 'portrait', 'day'],
    years_experience: 4,
    avg_rating: 4.9,
    review_count: 17,
    rate_half_day: 750,
    rate_full_day: 1300,
    portfolio_images: [
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&h=1000&fit=crop&q=88',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=1000&fit=crop&q=88',
      'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&h=1000&fit=crop&q=88',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=1000&fit=crop&q=88',
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&h=1000&fit=crop&q=88',
      'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=800&h=1000&fit=crop&q=88',
    ],
    profile_image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=600&fit=crop&q=88',
  },
};

const COLOR_WASHES = [
  'rgba(180,80,10,0.2)',
  'rgba(10,10,80,0.28)',
  'rgba(120,10,10,0.22)',
  'rgba(160,100,0,0.18)',
  'rgba(10,10,10,0.1)',
  'rgba(80,10,80,0.2)',
];

export default function LensmanProfile() {
  const { id } = useParams();
  const [activeImg, setActiveImg] = useState(null);

  // Try to find the lensman from DB first, fallback to hardcoded profiles
  const { data: dbLensman, isLoading } = useQuery({
    queryKey: ['lensman', id],
    queryFn: async () => {
      const list = await base44.entities.Lensman.filter({ id });
      return list[0] || null;
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => base44.entities.Review.filter({ lensman_id: id }),
    enabled: !!id,
  });

  // Use DB record if found, otherwise check hardcoded slugs
  const lensman = dbLensman || PROFILES[id] || null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] px-8 md:px-14 py-20">
        <Skeleton className="h-8 w-48 mb-4 bg-white/5" />
        <Skeleton className="h-4 w-64 mb-8 bg-white/5" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="aspect-[4/5] bg-white/5" />)}
        </div>
      </div>
    );
  }

  if (!lensman) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/40 mb-4">Creator not found</p>
          <Link to="/browse" className="text-[11px] font-body tracking-[0.1em] uppercase text-white/30 border-b border-white/15 pb-px">Back to browse</Link>
        </div>
      </div>
    );
  }

  const packages = [
    lensman.rate_half_day && { name: 'Half Day', desc: '4-hour shoot · Edited photos · Digital delivery', price: lensman.rate_half_day, type: 'half_day' },
    lensman.rate_full_day && { name: 'Full Day', desc: 'Content day or 8-hour shoot · Full package', price: lensman.rate_full_day, type: 'full_day' },
    lensman.rate_custom && { name: 'Custom', desc: lensman.custom_package_description || 'Custom package', price: lensman.rate_custom, type: 'custom' },
  ].filter(Boolean);

  const bookingId = dbLensman?.id || id;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* Back */}
      <div className="px-8 md:px-14 pt-24 pb-0">
        <Link to="/browse" className="inline-flex items-center gap-2 text-[10px] font-body tracking-[0.1em] uppercase transition-colors"
          style={{ color: 'rgba(255,255,255,0.25)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}>
          <ArrowLeft className="w-3 h-3" /> The Collective
        </Link>
      </div>

      {/* HERO — massive name, right-aligned bio, like Maya Chen reference */}
      <section className="px-8 md:px-14 pt-12 pb-16 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b pb-12" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16,1,0.3,1] }}>
            <p className="text-[8px] font-body tracking-[0.5em] uppercase mb-5 flex items-center gap-3" style={{ color: 'rgba(242,220,169,0.4)' }}>
              <span className="w-6 h-px inline-block" style={{ background: 'rgba(242,220,169,0.3)' }} />
              The Collective · NYC
            </p>
            <h1 className="font-display font-semibold text-white leading-[0.88]" style={{ fontSize: 'clamp(52px, 9vw, 130px)' }}>
              {lensman.display_name || lensman.full_name}
            </h1>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }}
            className="md:text-right md:max-w-xs">
            <p className="font-body text-[13px] leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {lensman.bio}
            </p>
            <div className="flex flex-wrap md:justify-end gap-2 mb-6">
              {lensman.specialties?.map((s, i) => (
                <span key={i} className="text-[9px] font-body tracking-[0.2em] uppercase px-3 py-1 border"
                  style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)', borderRadius: 1 }}>
                  {s}
                </span>
              ))}
            </div>
            <div className="flex md:justify-end items-center gap-4 text-[10px] font-body" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {lensman.neighborhoods?.slice(0, 2).join(' · ')}
              <span>·</span>
              <span>{lensman.years_experience}+ years</span>
              <span>·</span>
              <span>★ {lensman.avg_rating?.toFixed(1) || '5.0'}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PORTFOLIO — horizontal scroll strip like Jamie Rodriguez reference */}
      <section className="px-8 md:px-14 mb-20 max-w-[1400px] mx-auto">
        <p className="text-[8px] font-body tracking-[0.5em] uppercase mb-6" style={{ color: 'rgba(255,255,255,0.15)' }}>
          Selected work · {lensman.full_name}
        </p>

        {/* Horizontal scroll strip */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {(lensman.portfolio_images || []).map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.06, duration: 0.7 }}
              className="relative flex-shrink-0 overflow-hidden cursor-pointer group"
              style={{
                width: activeImg === i ? 280 : 160,
                height: 380,
                transition: 'width 0.5s cubic-bezier(.16,1,.3,1)',
                borderRadius: 2,
              }}
              onClick={() => setActiveImg(activeImg === i ? null : i)}
            >
              <img
                src={img}
                alt={`${lensman.display_name} portfolio ${i + 1}`}
                className="w-full h-full object-cover"
                style={{ filter: 'contrast(1.05) saturate(0.9) brightness(0.85)' }}
              />
              <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(135deg, ${COLOR_WASHES[i % COLOR_WASHES.length]} 0%, transparent 70%)` }} />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.6) 0%, transparent 50%)' }} />
              <div className="absolute bottom-3 left-3 text-[7px] font-body tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {String(i + 1).padStart(2, '0')}
              </div>
            </motion.div>
          ))}
        </div>
        <p className="text-[8px] font-body mt-3" style={{ color: 'rgba(255,255,255,0.12)' }}>Click to expand · scroll to see more</p>
      </section>

      {/* BOOKING — clean, dark, functional */}
      <section className="px-8 md:px-14 pb-32 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 items-start">

          {/* Left: packages */}
          <div>
            <p className="text-[8px] font-body tracking-[0.5em] uppercase mb-8" style={{ color: 'rgba(242,220,169,0.4)' }}>Packages</p>
            <div className="space-y-1">
              {packages.map((pkg, i) => (
                <div key={i} className="flex items-center justify-between py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div>
                    <p className="font-display text-[20px] font-semibold text-white mb-1">{pkg.name}</p>
                    <p className="text-[11px] font-body" style={{ color: 'rgba(255,255,255,0.25)' }}>{pkg.desc}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-[22px] font-semibold text-white">${pkg.price}</p>
                    <Link to={`/book/${bookingId}?package=${pkg.type}`}
                      className="text-[9px] font-body tracking-[0.1em] uppercase border-b pb-px transition-all"
                      style={{ color: 'rgba(242,220,169,0.5)', borderColor: 'rgba(242,220,169,0.2)' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#F2DCA9'; e.currentTarget.style.borderColor = '#F2DCA9'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(242,220,169,0.5)'; e.currentTarget.style.borderColor = 'rgba(242,220,169,0.2)'; }}>
                      Book this →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Includes */}
            <div className="mt-8 flex flex-wrap gap-5">
              {['Edited photos included', 'Full usage rights', 'Money held until delivery'].map((t, i) => (
                <span key={i} className="flex items-center gap-2 text-[10px] font-body" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  <span className="w-3 h-px inline-block" style={{ background: 'rgba(242,220,169,0.3)' }} />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right: sticky CTA */}
          <div className="lg:sticky lg:top-24">
            <div className="border border-white/6 p-7" style={{ borderRadius: 2 }}>
              {lensman.profile_image && (
                <div className="mb-6 overflow-hidden" style={{ height: 200, borderRadius: 2 }}>
                  <img src={lensman.profile_image} alt={lensman.full_name} className="w-full h-full object-cover" style={{ filter: 'contrast(1.05) saturate(0.8) brightness(0.85)' }} />
                </div>
              )}
              <p className="font-display text-[18px] font-semibold text-white mb-1">{lensman.full_name}</p>
              <p className="text-[10px] font-body mb-5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                {lensman.neighborhoods?.slice(0, 2).join(' · ')}
              </p>
              <div className="flex items-center gap-2 mb-6 pb-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <span className="text-[13px]" style={{ color: '#F2DCA9' }}>★</span>
                <span className="text-[12px] font-body text-white">{lensman.avg_rating?.toFixed(1) || '5.0'}</span>
                <span className="text-[11px] font-body" style={{ color: 'rgba(255,255,255,0.2)' }}>({lensman.review_count || 0} reviews)</span>
              </div>
              <Link to={`/book/${bookingId}`}
                className="block w-full text-center py-3.5 text-[11px] font-body tracking-[0.08em] uppercase font-semibold transition-all"
                style={{ background: '#F2DCA9', color: '#0a0a0a', borderRadius: 2 }}>
                Keep the night
              </Link>
            </div>
          </div>
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="mt-20 pt-12 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-[8px] font-body tracking-[0.5em] uppercase mb-8" style={{ color: 'rgba(255,255,255,0.15)' }}>Reviews</p>
            <ReviewsList reviews={reviews} />
          </div>
        )}
      </section>
    </div>
  );
}