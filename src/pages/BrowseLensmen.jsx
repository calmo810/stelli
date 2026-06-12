import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import SearchFilters from '../components/browse/SearchFilters';
import LensmanCard from '../components/browse/LensmanCard';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

export default function BrowseLensmen() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialEvent = urlParams.get('event') || 'all';

  const [filters, setFilters] = useState({
    search: '',
    eventType: initialEvent,
    style: 'all',
    sort: 'most_reviewed',
  });

  const { data: lensmen = [], isLoading } = useQuery({
    queryKey: ['lensmen'],
    queryFn: () => base44.entities.Lensman.filter({ status: 'approved' }),
  });

  const filtered = useMemo(() => {
    let result = [...lensmen];

    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(l =>
        l.full_name?.toLowerCase().includes(s) ||
        l.display_name?.toLowerCase().includes(s) ||
        l.neighborhoods?.some(n => n.toLowerCase().includes(s))
      );
    }

    if (filters.eventType !== 'all') {
      result = result.filter(l =>
        l.specialties?.some(sp =>
          sp.toLowerCase().includes(filters.eventType.replace('_', ' '))
        )
      );
    }

    if (filters.style !== 'all') {
      result = result.filter(l =>
        l.style_tags?.some(st => st.toLowerCase() === filters.style)
      );
    }

    switch (filters.sort) {
      case 'top_rated':
        result.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
        break;
      case 'most_reviewed':
        result.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
        break;
      case 'price_low':
        result.sort((a, b) => (a.rate_half_day || 0) - (b.rate_half_day || 0));
        break;
      case 'price_high':
        result.sort((a, b) => (b.rate_half_day || 0) - (a.rate_half_day || 0));
        break;
      case 'recently_added':
        result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        break;
    }

    return result;
  }, [lensmen, filters]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-cream star-bg py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Star className="w-6 h-6 text-gold fill-gold mx-auto mb-4" />
            <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight mb-3">Browse Lensmen</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Handpicked photographers and filmmakers, vetted and ready to capture your moment.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-6 relative z-10 pb-16">
        <SearchFilters filters={filters} onFilterChange={setFilters} />

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-border">
                <Skeleton className="aspect-[4/3]" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((l, i) => (
              <LensmanCard key={l.id} lensman={l} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No lensmen found matching your criteria.</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or check back soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}