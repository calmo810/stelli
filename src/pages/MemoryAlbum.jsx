import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, X, ChevronLeft, ChevronRight, Users, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function MemoryAlbum() {
  const { bookingId } = useParams();
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: booking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const list = await base44.entities.Booking.filter({ id: bookingId });
      return list[0];
    },
  });

  // Sample delivered images — in production these come from booking.delivered_files
  const photos = booking?.delivered_files?.length > 0
    ? booking.delivered_files
    : [
      'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=1200&h=1500&fit=crop',
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&h=900&fit=crop',
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=900&fit=crop',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=1000&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1558655146-d09347e92766?w=1200&h=1400&fit=crop',
    ];

  const shareLink = `${window.location.origin}/album/${bookingId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast('Link copied to clipboard');
  };

  const handleInvite = () => {
    if (!emailInput.trim()) return;
    toast(`Invite sent to ${emailInput}`);
    setEmailInput('');
  };

  const prevPhoto = () => setLightboxIndex(i => (i - 1 + photos.length) % photos.length);
  const nextPhoto = () => setLightboxIndex(i => (i + 1) % photos.length);

  return (
    <div className="min-h-screen bg-[#F5F4EF]">
      {/* Header */}
      <div className="bg-white border-b border-[#1a2a6c]/8 sticky top-16 z-30">
        <div className="max-w-[1300px] mx-auto px-8 py-5 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-body tracking-[0.3em] uppercase text-[#1a2a6c]/35 mb-1">Memory Album</p>
            <h1 className="font-display text-xl font-semibold text-[#1a2a6c]">
              {booking ? `${booking.event_type?.replace(/_/g, ' ') || 'Your shoot'} · ${new Date(booking.event_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}` : 'Your gallery is ready.'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShareOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#1a2a6c]/20 text-[#1a2a6c] text-[13px] font-body font-medium hover:bg-[#1a2a6c]/5 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" /> Share album
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a2a6c] text-white text-[13px] font-body font-medium hover:bg-[#22337a] transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Download all
            </button>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="max-w-[1300px] mx-auto px-8 py-12">

        {/* Stats bar */}
        <div className="flex items-center gap-6 mb-10 text-[12px] font-body text-[#999]">
          <span className="font-semibold text-[#1a2a6c]">{photos.length} photos</span>
          <span>·</span>
          <span className="flex items-center gap-1.5"><Users className="w-3 h-3" /> 3 people have access</span>
          <span>·</span>
          <span>Delivered by {booking?.lensman_name || 'your creator'}</span>
        </div>

        {/* Masonry grid */}
        <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
          {photos.map((url, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="break-inside-avoid group relative cursor-pointer rounded-xl overflow-hidden"
              onClick={() => setLightboxIndex(i)}
            >
              <img src={url} alt={`Memory ${i + 1}`} className="w-full object-cover transition-transform duration-500 group-hover:scale-102" loading="lazy" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-end p-3">
                <Download className="w-4 h-4 text-white" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
            onClick={() => setLightboxIndex(null)}
          >
            <button className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors" onClick={() => setLightboxIndex(null)}>
              <X className="w-6 h-6" />
            </button>
            <button className="absolute left-6 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors" onClick={e => { e.stopPropagation(); prevPhoto(); }}>
              <ChevronLeft className="w-8 h-8" />
            </button>
            <motion.img
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              src={photos[lightboxIndex]}
              alt="Memory"
              className="max-w-[85vw] max-h-[85vh] object-contain rounded-lg"
              onClick={e => e.stopPropagation()}
            />
            <button className="absolute right-6 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors" onClick={e => { e.stopPropagation(); nextPhoto(); }}>
              <ChevronRight className="w-8 h-8" />
            </button>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/30 text-[11px] font-body">
              {lightboxIndex + 1} / {photos.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share drawer */}
      <AnimatePresence>
        {shareOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40" onClick={() => setShareOpen(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white z-50 p-8 overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-display text-xl font-semibold text-[#1a2a6c]">Share your album</h2>
                <button onClick={() => setShareOpen(false)} className="text-[#999] hover:text-[#1a2a6c]"><X className="w-5 h-5" /></button>
              </div>

              <p className="font-body text-sm text-[#888] leading-relaxed mb-8">
                Anyone with the link can browse and download the full gallery — no account needed.
              </p>

              {/* Copy link */}
              <div className="mb-8">
                <p className="text-[10px] font-body tracking-[0.25em] uppercase text-[#1a2a6c]/40 mb-3">Share link</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#f5f4ef] rounded-xl px-4 py-3 text-[12px] font-body text-[#999] truncate">
                    {shareLink}
                  </div>
                  <button onClick={copyLink}
                    className="flex items-center gap-1.5 px-3 py-3 rounded-xl bg-[#1a2a6c] text-white text-[12px] font-body font-medium hover:bg-[#22337a] transition-all shrink-0">
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Invite by email */}
              <div>
                <p className="text-[10px] font-body tracking-[0.25em] uppercase text-[#1a2a6c]/40 mb-3">Invite by email</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="friend@email.com"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleInvite()}
                    className="flex-1 bg-[#f5f4ef] rounded-xl px-4 py-3 text-[13px] font-body text-[#1a1a1a] outline-none focus:ring-1 focus:ring-[#1a2a6c]/30"
                  />
                  <button onClick={handleInvite}
                    className="px-4 py-3 rounded-xl bg-[#1a2a6c] text-white text-[12px] font-body font-medium hover:bg-[#22337a] transition-all">
                    Invite
                  </button>
                </div>
              </div>

              {/* Current guests */}
              <div className="mt-10">
                <p className="text-[10px] font-body tracking-[0.25em] uppercase text-[#1a2a6c]/40 mb-4">Who has access</p>
                <div className="space-y-3">
                  {[
                    { name: 'Maya Johnson', role: 'Co-organizer' },
                    { name: 'Jordan Lee', role: 'Co-organizer' },
                    { name: 'Zara (the birthday girl)', role: 'Guest' },
                  ].map((g, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#1a2a6c]/10 flex items-center justify-center text-[11px] font-semibold text-[#1a2a6c]">
                        {g.name[0]}
                      </div>
                      <div>
                        <p className="font-body text-[12px] font-medium text-[#1a2a6c]">{g.name}</p>
                        <p className="font-body text-[10px] text-[#999]">{g.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}