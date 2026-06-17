import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export default function StelliHero() {
  const { ref, inView } = useInView({ threshold: 0.3 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  };

  return (
    <section 
      ref={ref}
      className="relative min-h-screen bg-cream flex items-center justify-center overflow-hidden"
    >
      {/* Animated background stars/sparkles */}
      <motion.div
        className="absolute inset-0 star-bg opacity-40"
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      {/* Organic flowing orbs - community energy */}
      <motion.div
        className="absolute top-20 right-10 w-64 h-64 bg-gold rounded-full blur-3xl opacity-15"
        animate={{
          y: [0, -30, 0],
          x: [0, 20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute -bottom-32 -left-32 w-80 h-80 bg-navy rounded-full blur-3xl opacity-10"
        animate={{
          y: [0, 30, 0],
          x: [0, -20, 0],
          scale: [1, 0.9, 1],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 max-w-4xl mx-auto px-6 text-center"
        variants={containerVariants}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
      >
        {/* Tagline with sparkle accent */}
        <motion.div variants={itemVariants} className="flex items-center justify-center gap-2 mb-6">
          <span className="text-sm uppercase tracking-widest text-navy/60 font-semibold">
            New York Creative Collective
          </span>
          <motion.svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            className="text-gold"
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          >
            <path
              fill="currentColor"
              d="M10 2l2.4 5.2h5.6l-4.5 3.3 1.7 5.2-4.2-3.1-4.2 3.1 1.7-5.2-4.5-3.3h5.6z"
            />
          </motion.svg>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          variants={itemVariants}
          className="text-6xl md:text-7xl lg:text-8xl font-display font-bold text-navy mb-6 leading-tight"
        >
          Capture Your
          <motion.span
            className="block text-gold mt-2"
            animate={{ opacity: [1, 0.8, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            Moment
          </motion.span>
        </motion.h1>

        {/* Subtitle - community focused */}
        <motion.p
          variants={itemVariants}
          className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Connect with elite photographers in NYC. Book unforgettable experiences. Create lasting memories with our creative collective.
        </motion.p>

        {/* CTA Buttons with staggered animation */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.button
            className="px-8 py-4 bg-navy text-cream font-semibold uppercase tracking-wide rounded-lg hover:shadow-xl transition-all"
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            Browse Photographers
          </motion.button>

          <motion.button
            className="px-8 py-4 border-2 border-navy text-navy font-semibold uppercase tracking-wide rounded-lg hover:bg-navy/5 transition-all"
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            Become a Creator
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Floating community stats with parallax */}
      <motion.div
        className="absolute bottom-10 left-10 text-center"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <div className="text-4xl font-bold text-navy">500+</div>
        <div className="text-sm text-foreground/60">Creators</div>
      </motion.div>

      <motion.div
        className="absolute bottom-10 right-10 text-center"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
      >
        <div className="text-4xl font-bold text-gold">2k+</div>
        <div className="text-sm text-foreground/60">Bookings</div>
      </motion.div>
    </section>
  );
}
