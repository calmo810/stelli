import { useEffect } from 'react';

/**
 * Asks search engines not to index the page it is used on, for as long as that
 * page is showing. Used by the admin page and the not-found page.
 */
export default function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => {
      meta.remove();
    };
  }, []);
}
