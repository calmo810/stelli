import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ArrowRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const EVENT_TYPES = [
  { value: 'birthday', label: 'Birthday' },
  { value: 'dinner', label: 'Dinner Party' },
  { value: 'rooftop', label: 'Rooftop Hang' },
  { value: 'music_video', label: 'Music Video' },
  { value: 'restaurant_launch', label: 'Restaurant Launch' },
  { value: 'content_day', label: 'Content Day' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'corporate', label: 'Corporate Event' },
  { value: 'custom', label: 'Something Else' },
];

export default function HeroSection() {
  const [eventType, setEventType] = useState('');

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center star-bg overflow-hidden">
      {/* Floating stars */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            top: `${15 + Math.random() * 60}%`,
            left: `${10 + Math.random() * 80}%`,
          }}
          animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1.3, 0.8] }}
          transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
        >
          <Star className="w-2 h-2 text-gold/30 fill-gold/20" />
        </motion.div>
      ))}

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground mb-6">
            一期一会 — One time, one meeting
          </p>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-semibold leading-[1.1] tracking-tight text-foreground mb-6">
            Your moment,{' '}
            <span className="italic text-gold">perfectly</span>{' '}
            captured.
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-12">
            Book vetted photographers and filmmakers for the moments that matter. 
            Curated creators, safe payments, stunning results.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-3 max-w-lg mx-auto"
        >
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger className="h-12 pl-11 pr-4 bg-card border-border rounded-full text-sm w-full shadow-sm">
                <SelectValue placeholder="What are you celebrating?" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Link to={eventType ? `/browse?event=${eventType}` : '/browse'}>
            <Button size="lg" className="h-12 px-8 rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-sm group">
              Browse Lensmen
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-xs text-muted-foreground"
        >
          ~10 handpicked creators per neighborhood · Fixed day rates · Payment held safely until delivery
        </motion.p>
      </div>
    </section>
  );
}