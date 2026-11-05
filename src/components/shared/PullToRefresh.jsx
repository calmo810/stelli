import React, { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Pull down from the top to reload. On a touch screen the content follows the
 * finger, a small ring fills in, and letting go past the threshold runs the
 * refresh while the ring spins. Nothing moves on a mouse or a keyboard.
 */

const THRESHOLD = 64;
const MAX_PULL = 108;

export default function PullToRefresh({ onRefresh, children, scrollRef }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const dragging = useRef(false);

  const atTop = () => {
    const el = scrollRef?.current;
    if (el) return el.scrollTop <= 0;
    return (window.scrollY || document.documentElement.scrollTop || 0) <= 0;
  };

  const onTouchStart = (event) => {
    if (refreshing || event.touches.length !== 1) return;
    startY.current = atTop() ? event.touches[0].clientY : null;
  };

  const onTouchMove = (event) => {
    if (startY.current == null || refreshing) return;
    const delta = event.touches[0].clientY - startY.current;
    if (delta <= 0 || !atTop()) {
      if (dragging.current) {
        dragging.current = false;
        setPull(0);
      }
      return;
    }
    dragging.current = true;
    setPull(Math.min(MAX_PULL, delta * 0.55));
  };

  const onTouchEnd = async () => {
    if (startY.current == null) return;
    startY.current = null;

    if (!dragging.current || pull < THRESHOLD) {
      dragging.current = false;
      setPull(0);
      return;
    }

    dragging.current = false;
    setRefreshing(true);
    setPull(THRESHOLD);
    try {
      await onRefresh?.();
    } catch {
      // A failed pull leaves what is already on screen in place.
    } finally {
      setRefreshing(false);
      setPull(0);
    }
  };

  const progress = Math.min(1, pull / THRESHOLD);
  const motion = dragging.current ? 'none' : 'transform .35s cubic-bezier(.22,1,.36,1)';

  return (
    <div
      className="relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center"
        style={{
          transform: `translateY(${pull - 42}px)`,
          opacity: refreshing ? 1 : progress,
          transition: `${motion}, opacity .2s linear`,
        }}
      >
        <span className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-ink/90 shadow-[0_8px_20px_-8px_rgba(0,0,0,.8)] backdrop-blur-md">
          <Loader2
            className={`h-4 w-4 text-neon-lime ${refreshing ? 'animate-spin' : ''}`}
            style={refreshing ? undefined : { transform: `rotate(${pull * 4}deg)` }}
          />
        </span>
      </div>

      <div style={{ transform: `translateY(${pull}px)`, transition: motion }}>{children}</div>

      <span role="status" className="sr-only">
        {refreshing ? 'Refreshing' : ''}
      </span>
    </div>
  );
}