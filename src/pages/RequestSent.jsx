import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import CanvasGlow from '@/components/shared/CanvasGlow';
import Pill from '@/components/shared/Pill';

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
      <div className="relative min-h-screen bg-ink">
        <CanvasGlow />
        <div className="relative mx-auto max-w-[640px] space-y-4 px-4 pb-24 pt-6 sm:px-5 md:pt-10">
          <div className="glass h-16 w-2/3 animate-pulse rounded-2xl" />
          <div className="glass h-[92px] animate-pulse rounded-3xl" />
          <div className="glass h-[180px] animate-pulse rounded-3xl" />
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
    <div className="relative min-h-screen bg-ink">
      <CanvasGlow />
      <div className="relative mx-auto max-w-[640px] px-4 pb-24 pt-6 sm:px-5 md:pt-10">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
          <span className="grid h-[52px] w-[52px] place-items-center rounded-2xl bg-neon-lime text-ink shadow-[0_10px_30px_-12px_hsl(var(--neon-lime)/0.8)]">
            <Check className="h-6 w-6" strokeWidth={2.6} />
          </span>
          <h1
            className="mt-5 font-display font-medium text-white"
            style={{ fontSize: 'clamp(42px, 7vw, 64px)', letterSpacing: '-0.025em', lineHeight: 1 }}
          >
            Request sent.
          </h1>

          <div className="glass mt-7 flex items-center gap-4 rounded-3xl p-3.5 pr-5">
            {photo ? (
              <img src={photo} alt={name} className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
            ) : (
              <div className="h-16 w-16 shrink-0 rounded-2xl bg-white/[0.08]" />
            )}
            <div className="min-w-0">
              <p className="truncate font-display text-[22px] font-medium leading-tight text-white">{name}</p>
              {dateLabel && <p className="mt-1 text-[14px] text-white/55">Requested for {dateLabel}</p>}
            </div>
          </div>

          <h2 className="mb-2.5 mt-8 pl-1.5 text-[13px] font-semibold text-white/50">What happens next</h2>
          <ol className="glass overflow-hidden rounded-3xl">
            {steps.map((step, i) => (
              <li key={i} className={`flex items-start gap-3.5 px-[18px] py-4${i ? ' border-t border-white/[0.08]' : ''}`}>
                <span className="mt-px grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/[0.1] text-[12px] font-semibold text-white/80">
                  {i + 1}
                </span>
                <span className="text-[15px] leading-snug text-white/75">{step}</span>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
            {booking && (
              <Link to={`/messages/${booking.id}`} className="block sm:flex-1">
                <Pill tone="lime" className="h-[52px] w-full">
                  <MessageCircle className="h-4 w-4" /> Go to messages
                </Pill>
              </Link>
            )}
            <Link to="/creators" className="block sm:flex-1">
              <Pill tone="glass" className="h-[52px] w-full">Back to creators</Pill>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
