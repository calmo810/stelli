import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import SearchFilters from '../components/browse/SearchFilters';
import LensmanCard from '../components/browse/LensmanCard';
import ConstellationMap from '../components/browse/ConstellationMap';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Grid3X3, Sparkles } from 'lucide-react';

export default function BrowseLensmen() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialEvent = urlParams.get('event_type') || urlParams.get('event') || 'all';

  const [filters, setFilters] = useState({ search: '', eventType: initialEvent, style: 'all', sort: 'most_reviewed' });
  const [viewMode, setViewMode] = useState('grid');

  const { data: lensmen = [], isLoading } = useQuery({
    queryKey: ['lensmen'],
    queryFn: () => base44.entities.Lensman.filter({ status: 'approved' }),
  });

  const filtered = useMemo(() => {
    let result = [...lensmen];
    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(l => l.full_name?.toLowerCase().includes(s) || l.display_name?.toLowerCase().includes(s) || l.neighborhoods?.some(n => n.toLowerCase().includes(s)));
    }
    if (filters.eventType !== 'all') result = result.filter(l => l.specialties?.some(sp => sp.toLowerCase().includes(filters.eventType.replace('_', ' '))));
    if (filters.style !== 'all') result = result.filter(l => l.style_tags?.some(st => st.toLowerCase() === filters.style));
    if (filters.sort === 'top_rated') result.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    if (filters.sort === 'most_reviewed') result.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
    if (filters.sort === 'price_low') result.sort((a, b) => (a.rate_half_day || 0) - (b.rate_half_day || 0));
    if (filters.sort === 'recently_added') result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    return result;
  }, [lensmen, filters]);

  return (
    <div className="min-h-screen" style={{ background: '#f0ede6' }}>
      <section className="pt-32 pb-12 px-8 md:px-14">
        <div className="max-w-[1180px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            <p className="text-[8px] font-body tracking-[0.5em] uppercase mb-6" style={{ color: 'rgba(26,39,68,0.3)' }}>The Collective</p>
            <h1 className="font-display font-semibold leading-[0.9] mb-5" style={{ fontSize: 'clamp(44px, 7vw, 92px)', color: '#1a2744' }}>
              Creators worth<br />putting in your calendar.
            </h1>
            <p className="font-body text-[13px] max-w-sm leading-relaxed" style={{ color: 'rgba(26,39,68,0.45)' }}>
              Vetted photographers and filmmakers with public Stelli profiles, private quotes, and protected bookings.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="max-w-[1180px] mx-auto px-8 md:px-14 pb-24 relative z-10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
          <div className="flex-1 w-full"><SearchFilters filters={filters} onFilterChange={setFilters} /></div>
          <div className="flex items-center gap-1 border p-1 shrink-0 glass-panel" style={{ borderColor: 'rgba(26,39,68,0.12)' }}>
            <button onClick={() => setViewMode('grid')} className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-body tracking-[0.08em] uppercase transition-all" style={{ background: viewMode === 'grid' ? '#1a2744' : 'transparent', color: viewMode === 'grid' ? '#f0ede6' : 'rgba(26,39,68,0.45)' }}><Grid3X3 className="w-3.5 h-3.5" /> Grid</button>
            <button onClick={() => setViewMode('constellation')} className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-body tracking-[0.08em] uppercase transition-all" style={{ background: viewMode === 'constellation' ? '#1a2744' : 'transparent', color: viewMode === 'constellation' ? '#f0ede6' : 'rgba(26,39,68,0.45)' }}><Sparkles className="w-3.5 h-3.5" /> Map</button>
          </div>
        </div>

        {viewMode === 'constellation' ? (
          <ConstellationMap lensmen={filtered.length > 0 ? filtered : lensmen} activeFilter={filters.eventType} />
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="Loading creators">{Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-[520px] editorial-card" />)}</div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((l, i) => <LensmanCard key={l.id} lensman={l} index={i} />)}
          </div>
        ) : (
          <div className="text-center py-20 border" style={{ borderColor: 'rgba(26,39,68,0.12)' }}>
            <p className="font-display text-3xl" style={{ color: '#1a2744' }}>No creators found.</p>
            <p className="text-sm mt-2" style={{ color: 'rgba(26,39,68,0.4)' }}>Try adjusting the filters.</p>
          </div>
        )}
      </section>
    </div>
  );
}