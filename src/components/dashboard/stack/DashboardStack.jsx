import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useOutlet } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';

const StackCloseContext = createContext(() => {});

/** Lets a sheet's own close button run the same animated close as the peek bar. */
export function useStackClose() {
  return useContext(StackCloseContext);
}

/**
 * A dashboard is the parent page; its quick sub-pages open as a sheet stacked
 * on top of it. The dashboard stays visible in the peek strip above the sheet,
 * so "back" is something you can see, tap, drag or gesture.
 */
export default function DashboardStack({ parentPath, children }) {
  const outlet = useOutlet();
  const navigate = useNavigate();
  const sheetRef = useRef(null);
  const drag = useRef({ active: false, startY: 0, dy: 0 });
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const pushed = !!outlet;

  const close = useCallback(() => {
    if (!outlet) return;
    setClosing(true);
    setTimeout(() => navigate(parentPath, { replace: true }), 360);
  }, [outlet, navigate, parentPath]);

  // Slide the sheet up once it is mounted, and hand it the focus.
  useEffect(() => {
    if (!outlet) {
      setOpen(false);
      setClosing(false);
      return;
    }
    const frame = requestAnimationFrame(() => {
      setOpen(true);
      sheetRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [outlet]);

  // While a sheet is up the page behind it is frozen, and the sheet starts at the top.
  useEffect(() => {
    if (!outlet) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (sheetRef.current) sheetRef.current.scrollTop = 0;
    return () => {
      document.body.style.overflow = previous;
    };
  }, [outlet]);

  useEffect(() => {
    if (!outlet) return;
    const onKey = (event) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [outlet, close]);

  const onPointerDown = (event) => {
    drag.current = { active: true, startY: event.clientY, dy: 0 };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!drag.current.active || !sheetRef.current) return;
    drag.current.dy = Math.max(0, event.clientY - drag.current.startY);
    sheetRef.current.classList.add('is-dragging');
    sheetRef.current.style.transform = `translateY(${drag.current.dy}px)`;
  };

  const onPointerUp = () => {
    if (!drag.current.active) return;
    const { dy } = drag.current;
    drag.current.active = false;
    if (sheetRef.current) {
      sheetRef.current.classList.remove('is-dragging');
      sheetRef.current.style.transform = '';
    }
    if (dy > 110) close();
  };

  return (
    <>
      <div
        className={`stack-parent${pushed ? ' is-pushed' : ''}`}
        inert={pushed ? '' : undefined}
      >
        {children}
      </div>

      {pushed && createPortal(
        <>
          <button type="button" className="stack-peek" onClick={close} aria-label="Back to your dashboard">
            <span className="stack-peek-chev">
              <ChevronUp className="h-3.5 w-3.5" strokeWidth={2.6} />
            </span>
            Dashboard <span className="text-white/45">· tap to go back</span>
          </button>

          <div
            ref={sheetRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            className={`stack-sheet${open && !closing ? ' is-open' : ''}`}
          >
            <div
              className="stack-grab"
              aria-hidden="true"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <span />
            </div>

            <div className="mx-auto w-full max-w-[640px] px-4 pb-24 outline-none sm:px-5">
              <StackCloseContext.Provider value={close}>{outlet}</StackCloseContext.Provider>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}