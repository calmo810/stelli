import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { profileUrl } from '@/lib/creatorProfile';
import Pill from '@/components/shared/Pill';

/** Copies the creator's profile link: the same address shown beside it. */
export default function CopyLinkPill({ creator, tone = 'cyan', className = '' }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const url = profileUrl(creator);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Copy your profile link', url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  return (
    <Pill as="button" type="button" onClick={copy} tone={tone} className={className} aria-live="polite">
      {copied && <Check className="h-4 w-4" aria-hidden />}
      {copied ? 'Link copied' : 'Copy profile link'}
    </Pill>
  );
}
