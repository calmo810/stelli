import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';

// Inertial, frame-synced page scrolling. Off for reduced motion and touch
// devices (their native scroll is already smooth). Nested scroll areas —
// chat threads, sheets, horizontal rails — keep their own scrolling.
let lenis = null;

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true });
  else window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}

export default function SmoothScroll() {
  const { pathname } = useLocation();

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (reduced || coarse) return undefined;

    lenis = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 0.95,
      smoothWheel: true,
      allowNestedScroll: true,
      anchors: true,
    });
    document.documentElement.classList.add('lenis-on');

    let frame = 0;
    const raf = (time) => {
      lenis?.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis?.destroy();
      lenis = null;
      document.documentElement.classList.remove('lenis-on');
    };
  }, []);

  // The messages screen is a fixed-height app view; let it scroll natively.
  useEffect(() => {
    if (!lenis) return;
    if (/^\/(portal\/)?messages/.test(pathname)) lenis.stop();
    else lenis.start();
  }, [pathname]);

  return null;
}
