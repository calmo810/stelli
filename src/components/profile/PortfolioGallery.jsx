import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PortfolioGallery({ images = [] }) {
  const [selectedIdx, setSelectedIdx] = useState(null);

  if (images.length === 0) return null;

  const navigate = (dir) => {
    setSelectedIdx(prev => {
      const next = prev + dir;
      if (next < 0) return images.length - 1;
      if (next >= images.length) return 0;
      return next;
    });
  };

  return (
    <>
      <div className="columns-2 md:columns-3 gap-3 space-y-3">
        {images.map((img, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="break-inside-avoid cursor-pointer group"
            onClick={() => setSelectedIdx(i)}
          >
            <div className="overflow-hidden rounded-xl">
              <img
                src={img}
                alt={`Portfolio ${i + 1}`}
                className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          </motion.div>
        ))}
      </div>

      <Dialog open={selectedIdx !== null} onOpenChange={() => setSelectedIdx(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black border-none overflow-hidden">
          <div className="relative">
            {selectedIdx !== null && (
              <img
                src={images[selectedIdx]}
                alt="Portfolio"
                className="w-full max-h-[85vh] object-contain"
              />
            )}
            <button
              onClick={() => setSelectedIdx(null)}
              className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate(-1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate(1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}