import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * The way out of every page that is not the home page. It sits in the page's
 * own flow, never pinned, as one small quiet pill on the ink.
 */
export default function BackButton({ className = '' }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    const path = location.pathname;
    // Pages reached from the portal go back to it, however you arrived.
    const fromPortal = path.startsWith('/album') || path.startsWith('/agreements') || path.startsWith('/account-settings');

    if (path.startsWith('/messages') || fromPortal) navigate('/portal');
    else if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex min-h-[40px] items-center gap-2 rounded-full bg-fill px-4 text-[13px] font-semibold text-fg-2 transition-colors hover:bg-fill-2 hover:text-fg ${className}`}
    >
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
      Back
    </button>
  );
}
