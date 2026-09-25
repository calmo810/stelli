import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { shareUrl } from '@/lib/profilePresets';
import Pill from '@/components/shared/Pill';

/** Copies the creator's public link, then says so. */
export default function CopyLinkPill({ creator }) {
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
    <Pill as="button" type="button" onClick={copy}>
      {copied && <Check className="h-4 w-4" />}
      {copied ? 'Link copied' : 'Copy profile link'}
    </Pill>
  );
}