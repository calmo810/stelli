import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

const SURFACE = { background: 'hsl(var(--surface))', borderRadius: 4 };
const CARD = 'border border-white/10';

/** Creator applications waiting on a founder decision, newest first. */
export default function AdminApplications() {
  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['admin-pending-applications'],
    queryFn: () => base44.entities.Lensman.filter({ status: 'pending' }, '-created_date'),
  });

  return (
    <div className="min-h-screen bg-ink">
      <div className="border-b border-white/10 py-12 px-5 md:px-10">
        <div className="max-w-[1400px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="label-mono text-[9px] text-white/35 mb-4">Internal</p>
            <h1 className="font-heading text-white font-semibold leading-[0.95] mb-3" style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}>
              Applications
            </h1>
            <p className="font-body text-[13px] text-white/45">
              {pending.length === 0
                ? 'Nothing waiting on you right now.'
                : `${pending.length} creator${pending.length === 1 ? '' : 's'} waiting on a decision.`}
            </p>
            <Link to="/admin" className="inline-block label-mono text-[10px] text-white/35 hover:text-neon-lime transition-colors mt-5">
              Back to admin
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-10">
        {isLoading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : pending.length === 0 ? (
          <p className="font-body text-[13px] text-center py-20 text-white/35">No pending applications.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((l) => {
              const photo = l.profile_image || l.portfolio_images?.[0] || '';
              return (
                <Link
                  key={l.id}
                  to={`/admin/applications/${l.id}`}
                  className={`${CARD} p-5 flex items-center gap-5 transition-colors hover:border-white/25`}
                  style={SURFACE}
                >
                  {photo ? (
                    <img src={photo} alt={l.full_name} className="w-16 h-16 object-cover shrink-0" style={{ borderRadius: 3 }} />
                  ) : (
                    <div className="w-16 h-16 shrink-0" style={{ background: 'hsl(var(--surface-2))', borderRadius: 3 }} />
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="font-heading text-[20px] font-semibold text-white leading-tight truncate">{l.full_name}</h3>
                    <p className="label-mono text-[9px] text-white/40 mt-2">
                      {l.market || 'NYC'} · {l.specialties?.slice(0, 3).join(' / ') || 'Photography'}
                    </p>
                    <p className="label-mono text-[9px] text-white/25 mt-1.5">
                      Signed up {l.created_date ? format(new Date(l.created_date), 'MMM d, yyyy') : '—'}
                    </p>
                  </div>

                  <ArrowRight className="w-4 h-4 text-white/30 shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}