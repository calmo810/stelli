import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { SHARE_HOST } from '@/lib/profilePresets';

/**
 * The profile link, generated from the display name. Shown as plain text with
 * a copy button, and a Change link that reveals the editable slug.
 */
export default function ProfileLinkField({ slug, displayName, onChange }) {
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const value = slug || displayName || '';
  const url = `${SHARE_HOST}/creators/${value}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div id="slug">
      <span className="block label-mono text-[10px] text-white/40 mb-2.5">Profile link</span>

      {editing ? (
        <div className="flex items-center gap-2">
          <span className="label-mono text-[10px] text-white/35 shrink-0">getstelli.com/creators/</span>
          <input
            type="text"
            autoFocus
            value={slug || ''}
            onChange={(event) => onChange(event.target.value)}
            className="flex-1 min-w-0 border border-white/10 bg-white/[0.03] px-3 py-2 font-body text-[13px] text-white outline-none focus:border-neon-cyan"
            style={{ borderRadius: 4 }}
          />
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="label-mono text-[9px] text-white/50 hover:text-white shrink-0"
          >
            Done
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <p className="font-body text-[13px] text-white/70 truncate">{url}</p>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 label-mono text-[9px] text-white/50 hover:text-neon-cyan shrink-0"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="label-mono text-[9px] text-white/50 hover:text-neon-cyan shrink-0"
          >
            Change
          </button>
        </div>
      )}
    </div>
  );
}