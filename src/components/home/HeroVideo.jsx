import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMarket } from '@/lib/market';

// Paste the uploaded hero video URL (stelli-hero.mp4) between the quotes.
const HERO_VIDEO_URL = '';
// Held final frame + fallback still (bright daylight, Manhattan).
const HERO_POSTER = 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=2000&q=80';

const rise = {
  hidden: { opacity: 0, y: 16 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut', delay: i * 0.08 },
  }),
};

export default function HeroVideo() {
  const { activeMarket } = useMarket();
  const [revealed, setRevealed] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const small = window.innerWidth < 640;

    if (!HERO_VIDEO_URL || reduced || small) {
      setRevealed(true);
      return;
    }

    setShowVideo(true);
    const safety = setTimeout(() => setRevealed(true), 14000);
    return () => clearTimeout(safety);
  }, []);

  return (
    <section className="relative w-full overflow-hidden bg-ink" style={{ height: '100svh', minHeight: 580 }}>
      <img src={HERO_POSTER} alt="" className="absolute inset-0 w-full h-full object-cover" />

      {showVideo && (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={HERO_VIDEO_URL}
          poster={HERO_POSTER}
          autoPlay
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          onEnded={() => setRevealed(true)}
          onError={() => setRevealed(true)}
        />
      )}

      {/* edge vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(125% 95% at 50% 45%, transparent 55%, rgba(10,15,30,0.6) 100%)' }}
      />

      {/* scrim */}
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{ opacity: revealed ? 1 : 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ background: 'hsl(var(--ink) / 0.55)' }}
      />
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{ opacity: revealed ? 1 : 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ background: 'linear-gradient(to top, hsl(var(--ink) / 0.92) 0%, transparent 60%)' }}
      />

      <div className="absolute inset-0 flex items-end">
        <div className="max-w-[1500px] mx-auto w-full px-5 md:px-10 pb-14 md:pb-20">
          <motion.p
            variants={rise}
            initial="hidden"
            animate={revealed ? 'show' : 'hidden'}
            custom={0}
            className="label-mono text-[10px] mb-5"
            style={{ color: 'hsl(var(--neon-lime))', textShadow: '0 2px 40px rgba(0,0,0,0.6)' }}
          >
            {activeMarket.label} — 2026
          </motion.p>

          <motion.h1
            variants={rise}
            initial="hidden"
            animate={revealed ? 'show' : 'hidden'}
            custom={1}
            className="font-heading font-semibold text-white leading-[0.92] mb-4"
            style={{ fontSize: 'clamp(46px, 9vw, 132px)', textShadow: '0 2px 40px rgba(0,0,0,0.55)' }}
          >
            You're the <span style={{ color: 'hsl(var(--neon-lime))' }}>star</span>.
          </motion.h1>

          <motion.p
            variants={rise}
            initial="hidden"
            animate={revealed ? 'show' : 'hidden'}
            custom={2}
            className="font-heading font-medium text-white/85 mb-9"
            style={{ fontSize: 'clamp(20px, 3vw, 38px)', textShadow: '0 2px 40px rgba(0,0,0,0.55)' }}
          >
            We just bring the camera.
          </motion.p>

          <motion.div
            variants={rise}
            initial="hidden"
            animate={revealed ? 'show' : 'hidden'}
            custom={3}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Link
              to="/creators"
              className="label-mono text-[11px] font-semibold px-8 py-4 text-center transition-transform duration-300 hover:-translate-y-0.5"
              style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}
            >
              Book a creator
            </Link>
            <Link
              to="/register?role=creator"
              className="label-mono text-[11px] font-semibold px-8 py-4 text-center border transition-colors duration-300"
              style={{ borderColor: 'hsl(var(--neon-cyan))', color: 'hsl(var(--neon-cyan))', borderRadius: 4 }}
            >
              Shoot with Stelli
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}