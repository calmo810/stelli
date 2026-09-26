import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * The way out of every page that is not the home page. It sits in the page's own
 * flow — never pinned — and on a page that opens with a photo it rides on the
 * photo itself.
 */
export default function BackButton({ variant = 'default', className = '' }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    const portalPath = ['/portal', '/client-dashboard', '/lensman-dashboard'].includes(location.pathname)
      || location.pathname.startsWith('/messages')
      || location.pathname.startsWith('/album')
      || location.pathname.startsWith('/agreements');

    if (location.pathname.startsWith('/messages')) navigate('/portal', { replace: true });
    else if (portalPath) navigate('/', { replace: true });
    else if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  const look = variant === 'hero'
    ? 'glass rounded-full px-4 py-2.5 text-white hover:bg-white/20'
    : 'rounded-full border border-white/10 bg-white/[0.06] px-4 py-2.5 text-white/80 hover:border-neon-lime/50 hover:text-white';

  return (
    <button
      onClick={handleBack}
      aria-label="Go back"
      className={`inline-flex items-center gap-2 transition-colors ${look} ${className}`}
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      <span className="label-mono text-[10px] font-semibold">Back</span>
    </button>
  );
}