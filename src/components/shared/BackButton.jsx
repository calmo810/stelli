import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <button
      onClick={handleBack}
      className="fixed top-20 left-4 md:left-8 z-40 inline-flex items-center gap-2 px-4 py-2.5 label-mono text-[10px] bg-ink/85 backdrop-blur border border-white/15 text-white/70 hover:text-neon-lime hover:border-neon-lime/50 transition-colors"
      style={{ borderRadius: 4 }}
      aria-label="Go back"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      Back
    </button>
  );
}