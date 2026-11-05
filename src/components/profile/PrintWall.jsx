import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { createWall, inkFor, matFor, printClass } from '@/lib/printWall';
import './printWall.css';

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The full-screen photo viewer. Opens by growing out of the print that was clicked. */
export function PhotoViewer({ photos, index, fromEl, onClose, onStep }) {
  const imgRef = useRef(null);
  const boxRef = useRef(null);
  const closeRef = useRef(null);
  const photo = photos[index];

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onStep(1);
      if (e.key === 'ArrowLeft') onStep(-1);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, onStep]);

  // Only the first open animates from the print; stepping just swaps the photo.
  useLayoutEffect(() => {
    const img = imgRef.current;
    const box = boxRef.current;
    if (!img || !box) return;
    if (!fromEl || reducedMotion() || !img.animate) {
      box.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
      return;
    }
    const src = (fromEl.querySelector('.pw-ph') || fromEl).getBoundingClientRect();
    const go = () => {
      const dst = img.getBoundingClientRect();
      if (!dst.width) return;
      const s = Math.max(src.width / dst.width, src.height / dst.height);
      const ix = (1 - Math.min(1, src.width / (dst.width * s))) * 50;
      const iy = (1 - Math.min(1, src.height / (dst.height * s))) * 50;
      const dx = src.left + src.width / 2 - (dst.left + dst.width / 2);
      const dy = src.top + src.height / 2 - (dst.top + dst.height / 2);
      img.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${s})`, clipPath: `inset(${iy}% ${ix}% ${iy}% ${ix}% round 3px)` },
          { transform: 'none', clipPath: 'inset(0% 0% 0% 0% round 10px)' },
        ],
        { duration: 620, easing: 'cubic-bezier(.16,1,.3,1)' }
      );
      box.animate([{ backgroundColor: 'rgba(5,8,18,0)' }, { backgroundColor: 'rgba(5,8,18,.95)' }], { duration: 420, easing: 'ease-out' });
      box.querySelectorAll('button, .pw-c').forEach((n) =>
        n.animate([{ opacity: 0 }, { opacity: 0, offset: 0.4 }, { opacity: 1 }], { duration: 620 })
      );
    };
    if (img.complete) go();
    else img.addEventListener('load', go, { once: true });
     
  }, []);

  if (!photo) return null;
  return createPortal(
    <div
      ref={boxRef}
      className="pw pw-lb"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {photo.src ? (
        <img ref={imgRef} src={photo.src} alt="" />
      ) : (
        <div ref={imgRef} style={{ width: 'min(60vw, 420px)', aspectRatio: '4 / 5', borderRadius: 10, background: photo.bg }} />
      )}
      <button ref={closeRef} className="pw-x" type="button" aria-label="Close" onClick={onClose}>
        <X strokeWidth={2} />
      </button>
      {photos.length > 1 && (
        <>
          <button className="pw-p" type="button" aria-label="Previous photo" onClick={() => onStep(-1)}>
            <ChevronLeft strokeWidth={2.2} />
          </button>
          <button className="pw-n" type="button" aria-label="Next photo" onClick={() => onStep(1)}>
            <ChevronRight strokeWidth={2.2} />
          </button>
        </>
      )}
      <div className="pw-c">
        {index + 1} / {photos.length}
      </div>
    </div>,
    document.body
  );
}

/** One print in the plain grid. */
function GridPrint({ photo, i, total, settings, label, onOpen }) {
  const mat = matFor(i, settings.mat);
  const { title, meta } = label(i);
  return (
    <button
      type="button"
      className={`pw-shot ${printClass(settings)}`}
      style={{ '--mat': mat, '--matInk': inkFor(mat) }}
      aria-label={`Open photo ${i + 1} of ${total}`}
      onClick={(e) => onOpen(i, e.currentTarget)}
    >
      <div className="pw-ph" style={photo.bg ? { background: photo.bg } : undefined}>
        {photo.src && <img src={photo.src} alt="" loading="lazy" decoding="async" draggable={false} />}
      </div>
      <div className="pw-lab">
        <b>{title}</b>
        <span>{meta}</span>
      </div>
    </button>
  );
}

/**
 * The creator's work, hung the way the creator chose: a curved wall, one long
 * strip, or a grid. `settings` comes from the creator's own profile record.
 */
export default function PrintWall({
  photos,
  settings,
  label,
  accent,
  name = 'their',
  compact = false,
  showAll = false,
  className = '',
}) {
  const wallRef = useRef(null);
  const rowsRef = useRef(null);
  const engineRef = useRef(null);
  const [open, setOpen] = useState(null); // { index, fromEl }
  const useGrid = showAll || settings.layout === 'grid' || photos.length < 2;

  const openAt = useCallback((index, fromEl) => setOpen({ index, fromEl }), []);
  const close = useCallback(() => setOpen(null), []);
  const stepBy = useCallback(
    (d) => setOpen((o) => (o ? { index: (o.index + d + photos.length) % photos.length, fromEl: null } : o)),
    [photos.length]
  );

  const labelRef = useRef(label);
  labelRef.current = label;
  const key = JSON.stringify([photos.map((p) => p.src || p.bg), settings, compact]);

  useEffect(() => {
    if (useGrid || !wallRef.current || !rowsRef.current) return undefined;
    const engine = createWall({
      wall: wallRef.current,
      rowsEl: rowsRef.current,
      photos,
      settings,
      label: (i) => labelRef.current(i),
      onOpen: (i, el) => openAt(i, el),
      compact,
    });
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
     
  }, [key, useGrid]);

  if (!photos.length) return null;

  return (
    <div className={`pw ${compact ? 'pw-compact' : ''} ${className}`} style={accent ? { '--pw-accent': accent } : undefined}>
      {useGrid ? (
        <div className="pw-grid">
          {photos.map((photo, i) => (
            <GridPrint key={`${photo.src || photo.bg}-${i}`} photo={photo} i={i} total={photos.length} settings={settings} label={label} onOpen={openAt} />
          ))}
        </div>
      ) : (
        <section
          ref={wallRef}
          className="pw-wall"
          tabIndex={compact ? -1 : 0}
          aria-label={`${name} work. Drag, or use the arrow keys, to explore. Select a print to open it.`}
        >
          <div className="pw-room" aria-hidden="true" />
          <div ref={rowsRef} className="pw-rows" />
          <div className="pw-hint">
            <button type="button" className="pw-round" aria-label="Scroll the wall left" onClick={() => engineRef.current?.prev()}>
              <ChevronLeft strokeWidth={2.2} />
            </button>
            <span>Drag to explore · click to open</span>
            <button type="button" className="pw-round" aria-label="Scroll the wall right" onClick={() => engineRef.current?.next()}>
              <ChevronRight strokeWidth={2.2} />
            </button>
          </div>
        </section>
      )}

      {open && !compact && (
        <PhotoViewer photos={photos} index={open.index} fromEl={open.fromEl} onClose={close} onStep={stepBy} />
      )}
    </div>
  );
}
