import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import SearchFilters from '../components/browse/SearchFilters';
import LensmanCard from '../components/browse/LensmanCard';
import ConstellationMap from '../components/browse/ConstellationMap';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Star, Grid3X3, Sparkles } from 'lucide-react';

export default function BrowseLensmen() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialEvent = urlParams.get('event') || 'all';

  const [filters, setFilters] = useState({
    search: '',
    eventType: initialEvent,
    style: 'all',
    sort: 'most_reviewed',
  });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'constellation'

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
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="py-28 px-8 md:px-14">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-[8px] font-body tracking-[0.5em] uppercase mb-6 flex items-center gap-3" style={{ color: 'rgba(242,220,169,0.4)' }}>
              <span className="w-6 h-px inline-block" style={{ background: 'rgba(242,220,169,0.3)' }} />
              The Collective
            </p>
            <h1 className="font-display font-semibold text-white leading-[0.9] mb-5" style={{ fontSize: 'clamp(36px, 6vw, 80px)' }}>
              The people<br />behind the lens.
            </h1>
            <p className="font-body text-[13px] max-w-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Vetted photographers and filmmakers. Real people, real moments, fixed prices.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 md:px-14 pb-24 relative z-10">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex-1"><SearchFilters filters={filters} onFilterChange={setFilters} /></div>
          <div className="flex items-center gap-1 bg-white border border-border rounded-xl p-1 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all ${viewMode === 'grid' ? 'bg-[#1a2a6c] text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Grid3X3 className="w-3.5 h-3.5" /> Grid
            </button>
            <button
              onClick={() => setViewMode('constellation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all ${viewMode === 'constellation' ? 'bg-[#1a2a6c] text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Constellation
            </button>
          </div>
        </div>

        {viewMode === 'constellation' ? (
          <ConstellationMap lensmen={filtered.length > 0 ? filtered : lensmen} activeFilter={filters.eventType} />
        ) : isLoading ? (
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
        ) : null}

        {viewMode === 'grid' && !isLoading && filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((l, i) => (
              <LensmanCard key={l.id} lensman={l} index={i} />
            ))}
          </div>
        ) : viewMode === 'grid' && !isLoading && filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No lensmen found matching your criteria.</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or check back soon.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}