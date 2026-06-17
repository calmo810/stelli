import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BadgeCheck, Star } from 'lucide-react';

function slugifyName(name = '') {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function maskName(fullName) {
  if (!fullName) return '';
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export default function LensmanCard({ lensman, index = 0 }) {
  const images = lensman.portfolio_images || [];
  const heroImage = images[0] || lensman.profile_image;
  const displayName = lensman.display_name || maskName(lensman.full_name);
  const slug = lensman.slug || slugifyName(lensman.display_name || lensman.full_name) || lensman.id;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
      <Link to={`/creators/${slug}`} className="block group border" style={{ borderColor: 'rgba(26,39,68,0.12)', background: '#ece9e2' }}>
        <div className="relative overflow-hidden h-[430px]">
          {heroImage ? (
            <motion.img src={heroImage} alt={displayName} className="w-full h-full object-cover" whileHover={{ scale: 1.035 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} loading="lazy" style={{ filter: 'contrast(1.04) saturate(0.85)' }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: '#ded9cf' }}><p className="text-[8px] font-body tracking-[0.3em] uppercase" style={{ color: 'rgba(26,39,68,0.25)' }}>Portfolio pending</p></div>
          )}
          <div className="absolute inset-x-0 bottom-0 p-4" style={{ background: 'linear-gradient(to top, rgba(26,39,68,0.62), transparent)' }}>
            <p className="text-[7px] font-body tracking-[0.25em] uppercase text-white/45">getstelli.com/creators/{slug}</p>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-display text-[28px] font-semibold leading-none" style={{ color: '#1a2744' }}>{displayName}</p>
                <BadgeCheck className="w-4 h-4" style={{ color: '#1a2744' }} />
              </div>
              <p className="text-[10px] font-body" style={{ color: 'rgba(26,39,68,0.4)' }}>{lensman.neighborhoods?.slice(0, 2).join(' · ')}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-display text-[22px] font-semibold" style={{ color: '#1a2744' }}>${lensman.rate_half_day || 800}</p>
              <p className="text-[9px] font-body" style={{ color: 'rgba(26,39,68,0.3)' }}>from</p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: 'rgba(26,39,68,0.1)' }}>
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-current" style={{ color: '#1a2744' }} />
              <span className="text-[11px] font-body" style={{ color: 'rgba(26,39,68,0.55)' }}>{lensman.avg_rating?.toFixed(1) || '5.0'} · {lensman.review_count || 0} reviews</span>
            </div>
            <span className="text-[9px] font-body tracking-[0.12em] uppercase" style={{ color: 'rgba(26,39,68,0.45)' }}>View profile</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}