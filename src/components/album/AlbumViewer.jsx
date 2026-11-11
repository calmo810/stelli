import React, { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react';

const SWIPE_PX = 48;

/** One photograph, edge to edge: arrows or a swipe either way, Esc to leave. */
export default function AlbumViewer({ photos, index, onClose, onIndex }) {
  const startX = useRef(null);
  const photo = photos[index];
  const total = photos.length;

  const step = (delta) => onIndex((index + delta + total) % total);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') onIndex((index + 1) % total);
      if (event.key === 'ArrowLeft') onIndex((index - 1 + total) % total);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, total, onClose, onIndex]);

  // The page behind the viewer must not scroll while a photo fills the screen.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  if (!photo) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      className="fixed inset-0 z-[70] flex flex-col bg-ink/95"
      style={{ WebkitBackdropFilter: 'blur(24px)', backdropFilter: 'blur(24px)' }}
      onTouchStart={(event) => {
        startX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (startX.current === null) return;
        const moved = (event.changedTouches[0]?.clientX ?? startX.current) - startX.current;
        startX.current = null;
        if (Math.abs(moved) > SWIPE_PX) step(moved < 0 ? 1 : -1);
      }}
    >
      <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-[calc(14px+var(--safe-top))]">
        <span className="label-mono text-[10px] text-white/55">
          {index + 1} / {total}
        </span>
        <div className="flex items-center gap-2">
          <a
            href={photo.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-2 text-[12px] font-semibold text-white/75 transition-colors hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Original
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close viewer"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white/80 transition-colors hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-3">
        <img
          key={photo.id}
          src={photo.url}
          alt={photo.name || `Photo ${index + 1}`}
          className="max-h-full max-w-full rounded-[18px] object-contain"
        />

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous photo"
              className="absolute left-2 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-ink/50 text-white/80 backdrop-blur-md transition-colors hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next photo"
              className="absolute right-2 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-ink/50 text-white/80 backdrop-blur-md transition-colors hover:text-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      <p className="px-5 pb-[calc(16px+var(--safe-bottom))] pt-3 text-center text-[12px] text-white/40">
        {total > 1 ? 'Swipe or use the arrows to keep going' : photo.name || ''}
      </p>
    </div>
  );
}