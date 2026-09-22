import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

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
    <button
      onClick={handleBack}
      className="fixed top-20 left-4 md:left-8 z-[55] inline-flex items-center gap-2 px-4 py-2.5 label-mono text-[10px] bg-ink/90 backdrop-blur border border-white/15 text-white/70 hover:text-neon-lime hover:border-neon-lime/50 transition-colors shadow-lg"
      style={{ borderRadius: 4 }}
      aria-label="Go back"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      Back
    </button>
  );
}