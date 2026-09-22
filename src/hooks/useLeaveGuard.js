import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Guards unsaved edits against both in-app navigation and the browser's
 * beforeunload event. `requestLeave(proceed)` runs `proceed` straight away when
 * there is nothing to lose, otherwise it opens the confirm dialog first.
 */
export default function useLeaveGuard(dirty) {
  const navigate = useNavigate();
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const pending = useRef(null);
  const [open, setOpen] = useState(false);

  const requestLeave = useCallback((proceed) => {
    if (!dirtyRef.current) {
      proceed();
      return;
    }
    pending.current = proceed;
    setOpen(true);
  }, []);

  const keepEditing = useCallback(() => {
    pending.current = null;
    setOpen(false);
  }, []);

  const leave = useCallback(() => {
    const proceed = pending.current;
    pending.current = null;
    setOpen(false);
    if (proceed) proceed();
  }, []);

  useEffect(() => {
    if (!dirty) return undefined;
    const onBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    const onClick = (event) => {
      if (!dirtyRef.current || event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target?.closest?.('a[href]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || !href.startsWith('/') || anchor.target === '_blank') return;
      event.preventDefault();
      event.stopPropagation();
      requestLeave(() => navigate(href));
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [navigate, requestLeave]);

  return { open, requestLeave, keepEditing, leave };
}