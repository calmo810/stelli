import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CTASection() {
  return (
    <section className="py-24 px-6 bg-foreground text-background relative overflow-hidden star-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto text-center relative z-10"
      >
        <Star className="w-8 h-8 text-gold fill-gold mx-auto mb-6 animate-twinkle" />
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-6">
          Ready to capture your next moment?
        </h2>
        <p className="text-background/60 text-lg mb-10 max-w-xl mx-auto">
          Whether it's a birthday, a business launch, or a music video — your perfect creator is one click away.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/browse">
            <Button size="lg" className="h-12 px-8 rounded-full bg-background text-foreground hover:bg-background/90 group">
              Browse Lensmen
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link to="/apply">
            <Button variant="outline" size="lg" className="h-12 px-8 rounded-full border-background/30 text-background hover:bg-background/10">
              Join as Creator
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}