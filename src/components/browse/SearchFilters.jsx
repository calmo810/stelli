import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal } from 'lucide-react';

const EVENT_TYPES = [
  { value: 'all', label: 'All Events' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'dinner', label: 'Dinner Party' },
  { value: 'rooftop', label: 'Rooftop Hang' },
  { value: 'music_video', label: 'Music Video' },
  { value: 'restaurant_launch', label: 'Restaurant Launch' },
  { value: 'content_day', label: 'Content Day' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'corporate', label: 'Corporate' },
];

const STYLES = [
  { value: 'all', label: 'All Styles' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'documentary', label: 'Documentary' },
  { value: 'vibrant', label: 'Vibrant' },
  { value: 'moody', label: 'Moody' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'cinematic', label: 'Cinematic' },
];

const SORT_OPTIONS = [
  { value: 'most_reviewed', label: 'Most Reviewed' },
  { value: 'recently_added', label: 'Recently Added' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'top_rated', label: 'Top Rated' },
];

export default function SearchFilters({ filters, onFilterChange }) {
  const update = (key, value) => onFilterChange({ ...filters, [key]: value });

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 mb-8">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or neighborhood..."
            value={filters.search || ''}
            onChange={e => update('search', e.target.value)}
            className="pl-10 h-10 rounded-xl border-border"
          />
        </div>

        <Select value={filters.eventType || 'all'} onValueChange={v => update('eventType', v)}>
          <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl">
            <SelectValue placeholder="Event Type" />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPES.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.style || 'all'} onValueChange={v => update('style', v)}>
          <SelectTrigger className="w-full sm:w-36 h-10 rounded-xl">
            <SelectValue placeholder="Style" />
          </SelectTrigger>
          <SelectContent>
            {STYLES.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.sort || 'most_reviewed'} onValueChange={v => update('sort', v)}>
          <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl">
            <SlidersHorizontal className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}