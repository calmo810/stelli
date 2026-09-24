import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ExternalLink, Copy, Check, ImageOff } from 'lucide-react';

export default function MemoryAlbum() {
  const { bookingId } = useParams();
  const [copied, setCopied] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['album-booking', bookingId],
    queryFn: async () => {
      const response = await base44.functions.invoke('getAlbumBooking', { bookingId });
      return response.data?.booking || null;
    },
  });

  const shareLink = `${window.location.origin}/album/${bookingId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const deliveredLabel = booking?.delivered_at
    ? new Date(booking.delivered_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  const title = booking
    ? `${booking.event_type?.replace(/_/g, ' ') || 'Your shoot'} · ${booking.event_date ? new Date(booking.event_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : ''}`
    : 'Your gallery';

  return (
    <div className="min-h-screen bg-ink">
      <div className="max-w-3xl mx-auto px-5 md:px-8 py-20">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <p className="label-mono text-[9px] text-white/35 mb-4">Memory Album</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold mb-4 capitalize text-white">
            {title}
          </h1>
          <p className="font-body text-[13px] mb-12 text-white/50">
            {booking?.lensman_name ? `Delivered by ${booking.lensman_name}` : 'Your creator'}
            {deliveredLabel ? ` · ${deliveredLabel}` : ''}
          </p>

          {isLoading ? (
            <div className="border border-white/10 p-10 text-center" style={{ borderRadius: 4 }}>
              <p className="font-body text-[13px] text-white/45">Loading your gallery…</p>
            </div>
          ) : booking?.delivery_link ? (
            <a
              href={booking.delivery_link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-3 w-full py-5 label-mono text-[11px] font-semibold transition-transform hover:-translate-y-0.5"
              style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}
            >
              <ExternalLink className="w-4 h-4" /> Open your gallery
            </a>
          ) : (
            <div className="border border-white/10 p-10 text-center" style={{ borderRadius: 4 }}>
              <ImageOff className="w-6 h-6 mx-auto mb-4 text-white/30" />
              <p className="font-body text-[13px] text-white/50">
                Your gallery isn't ready yet. We'll email you the moment your creator delivers it.
              </p>
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="label-mono text-[9px] text-white/35 mb-3">Share this album</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-3 font-body text-[12px] truncate text-white/50" style={{ background: 'hsl(var(--surface))', borderRadius: 4 }}>
                {shareLink}
              </div>
              <button
                onClick={copyLink}
                aria-label="Copy album link"
                className="flex items-center gap-1.5 px-4 py-3 font-body text-[12px] font-medium shrink-0"
                style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}