import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const EVENT_TYPES = [
  { value: 'all', label: 'All events' }, { value: 'birthday', label: 'Birthday' }, { value: 'dinner', label: 'Dinner' }, { value: 'rooftop', label: 'Rooftop' }, { value: 'music_video', label: 'Music video' }, { value: 'restaurant_launch', label: 'Launch' }, { value: 'content_day', label: 'Content day' }, { value: 'proposal', label: 'Proposal' },
];
const STYLES = [
  { value: 'all', label: 'All styles' }, { value: 'portrait', label: 'Portrait' }, { value: 'documentary', label: 'Documentary' }, { value: 'editorial', label: 'Editorial' }, { value: 'cinematic', label: 'Cinematic' },
];
const SORT_OPTIONS = [
  { value: 'most_reviewed', label: 'Most reviewed' }, { value: 'recently_added', label: 'Recently added' }, { value: 'price_low', label: 'Price low' }, { value: 'top_rated', label: 'Top rated' },
];

export default function SearchFilters({ filters, onFilterChange }) {
  const update = (key, value) => onFilterChange({ ...filters, [key]: value });

  return (
    <div className="border p-3 mb-8" style={{ background: 'hsl(var(--surface))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <Input
            placeholder="Search creators or neighborhoods"
            value={filters.search || ''}
            onChange={(e) => update('search', e.target.value)}
            className="pl-9 h-10 rounded-none border-0 bg-transparent text-[12px] text-white"
          />
        </div>
        <Select value={filters.eventType || 'all'} onValueChange={(v) => update('eventType', v)}>
          <SelectTrigger className="w-full sm:w-40 h-10 rounded-none border-0 bg-transparent text-[12px] text-white"><SelectValue /></SelectTrigger>
          <SelectContent>{EVENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.style || 'all'} onValueChange={(v) => update('style', v)}>
          <SelectTrigger className="w-full sm:w-36 h-10 rounded-none border-0 bg-transparent text-[12px] text-white"><SelectValue /></SelectTrigger>
          <SelectContent>{STYLES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.sort || 'most_reviewed'} onValueChange={(v) => update('sort', v)}>
          <SelectTrigger className="w-full sm:w-36 h-10 rounded-none border-0 bg-transparent text-[12px] text-white"><SelectValue /></SelectTrigger>
          <SelectContent>{SORT_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>
  );
}