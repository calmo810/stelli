import React, { useState } from 'react';
import { Check, Share2 } from 'lucide-react';
import { shareUrl } from '@/lib/profilePresets';

export default function ShareProfileButton({ creator, className = '' }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const url = shareUrl(creator);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Copy your profile link', url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  return (
    <button
      onClick={copy}
      className={`inline-flex items-center justify-center gap-2 label-mono text-[10px] px-4 py-3 border transition-colors duration-300 hover:border-white/40 ${className}`}
      style={{ borderColor: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.6)', borderRadius: 4 }}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
      {copied ? 'Link copied' : 'Share profile'}
    </button>
  );
}