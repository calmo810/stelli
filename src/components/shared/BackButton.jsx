import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Every page that is not the home page carries the same way out, pinned to the
 * top-left of the content measure so it never drifts between pages.
 */
export default function BackButton() {
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

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[70px] z-[55]">
      <div className="mx-auto flex max-w-[1240px] px-5 md:px-10">
        <button
          onClick={handleBack}
          aria-label="Go back"
          className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#1a1c24]/85 px-4 py-2.5 text-white/80 backdrop-blur-md transition-colors hover:border-neon-lime/50 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="label-mono text-[10px] font-semibold">Back</span>
        </button>
      </div>
    </div>
  );
}