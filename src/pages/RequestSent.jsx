import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const LIME = 'hsl(var(--neon-lime))';
const INK = 'hsl(var(--ink))';

/** Lands here the moment a booking request is filed. */
export default function RequestSent() {
  const { bookingId } = useParams();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['request-sent-booking', bookingId],
    enabled: !!bookingId,
    queryFn: async () => {
      const list = await base44.entities.Booking.filter({ id: bookingId });
      return list[0] || null;
    },
  });

  const { data: creator } = useQuery({
    queryKey: ['request-sent-creator', booking?.lensman_id],
    enabled: !!booking?.lensman_id,
    queryFn: async () => {
      const list = await base44.entities.Lensman.filter({ id: booking.lensman_id });
      return list[0] || null;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink">
        <div className="max-w-[760px] mx-auto px-5 md:px-10 pt-32 pb-24">
          <Skeleton className="h-[420px] w-full" />
        </div>
      </div>
    );
  }

  const name = creator?.display_name || creator?.full_name || booking?.lensman_name || 'your creator';
  const photo = creator?.profile_image || creator?.portfolio_images?.[0] || '';
  const dateLabel = booking?.event_date
    ? format(new Date(`${booking.event_date}T12:00:00`), 'MMMM d, yyyy')
    : null;

  const steps = [
    `${name} looks at your date.`,
    "They'll message you here to work out the details.",
    "You'll get a private quote. Nothing is charged until you accept it.",
  ];

  return (
    <div className="min-h-screen bg-ink">
      <div className="max-w-[760px] mx-auto px-5 md:px-10 pt-28 md:pt-32 pb-24">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
          <p className="label-mono text-[9px] text-white/35 mb-5">Request filed</p>
          <h1 className="font-heading font-semibold text-white leading-[0.95] mb-10" style={{ fontSize: 'clamp(44px, 8vw, 92px)' }}>
            Request sent.
          </h1>

          <div className="flex items-center gap-4 border border-white/10 p-4 mb-10" style={{ background: 'hsl(var(--surface))', borderRadius: 4 }}>
            {photo ? (
              <img src={photo} alt={name} className="w-16 h-16 object-cover shrink-0" style={{ borderRadius: 3 }} />
            ) : (
              <div className="w-16 h-16 shrink-0" style={{ background: 'hsl(var(--surface-2))', borderRadius: 3 }} />
            )}
            <div className="min-w-0">
              <p className="font-heading text-[22px] font-semibold text-white leading-tight truncate">{name}</p>
              {dateLabel && (
                <p className="label-mono text-[9px] text-white/40 mt-2">Requested for {dateLabel}</p>
              )}
            </div>
          </div>

          <ol className="space-y-5 mb-12">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="font-mono text-[11px] shrink-0 mt-0.5" style={{ color: LIME }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="font-body text-[14px] leading-relaxed text-white/55">{step}</span>
              </li>
            ))}
          </ol>

          {booking && (
            <Link
              to={`/messages/${booking.id}`}
              className="flex items-center justify-center gap-2.5 w-full label-mono text-[11px] font-semibold px-8 py-4 transition-transform duration-300 hover:-translate-y-0.5"
              style={{ background: LIME, color: INK, borderRadius: 4 }}
            >
              <MessageCircle className="w-4 h-4" /> Go to messages
            </Link>
          )}

          <Link
            to="/creators"
            className="inline-flex items-center gap-2 label-mono text-[10px] text-white/35 hover:text-neon-lime transition-colors mt-6"
          >
            Back to creators <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}