import React, { useState } from 'react';
import { Check, Loader2, Target, Upload } from 'lucide-react';
import { ACCEPT_ATTR, coverSizeError, measureUrl } from '@/lib/imageQuality';

export default function CoverPicker({ images = [], cover, focal, onPick, onFocal, onUpload, uploading, externalError }) {
  const [error, setError] = useState('');
  const [checking, setChecking] = useState('');

  const pick = async (url) => {
    setError('');
    setChecking(url);
    try {
      const size = await measureUrl(url);
      const problem = coverSizeError(size);
      if (problem) {
        setError(problem);
        return;
      }
      onPick(url);
    } catch {
      setError('Could not read that image.');
    } finally {
      setChecking('');
    }
  };

  const setFocalFromClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 100);
    onFocal({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) });
  };

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <p className="label-mono text-[9px] text-white/40">Cover shot</p>
        {cover && (
          <button onClick={() => onPick('')} className="label-mono text-[9px] text-white/30 hover:text-white/60">
            Clear
          </button>
        )}
      </div>

      {cover ? (
        <div className="mb-4">
          <button
            onClick={setFocalFromClick}
            className="relative block w-full overflow-hidden cursor-crosshair"
            style={{ borderRadius: 4 }}
            title="Tap the part that matters most"
          >
            <img src={cover} alt="Cover" className="w-full aspect-[3/2] object-cover" />
            <span
              className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 flex items-center justify-center pointer-events-none"
              style={{ left: `${focal?.x ?? 50}%`, top: `${focal?.y ?? 50}%`, borderColor: 'hsl(var(--neon-lime))' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(var(--neon-lime))' }} />
            </span>
          </button>
          <p className="flex items-center gap-2 font-body text-[11px] text-white/35 mt-2">
            <Target className="w-3 h-3" /> Tap the part that matters most — the cover crops around it.
          </p>
        </div>
      ) : (
        <p className="font-body text-[12px] text-white/35 mb-4">
          Pick one of your portfolio images below to lead the profile.
        </p>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {images.map((url) => {
            const active = cover === url;
            return (
              <button
                key={url}
                onClick={() => pick(url)}
                className="relative aspect-square overflow-hidden border transition-colors"
                style={{ borderColor: active ? 'hsl(var(--neon-lime))' : 'rgba(255,255,255,0.1)', borderRadius: 3 }}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
                {checking === url && (
                  <span className="absolute inset-0 flex items-center justify-center bg-ink/70">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  </span>
                )}
                {active && (
                  <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--neon-lime))' }}>
                    <Check className="w-2.5 h-2.5" style={{ color: 'hsl(var(--ink))' }} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <label className="inline-flex items-center gap-2 label-mono text-[9px] text-white/40 hover:text-white/70 cursor-pointer mt-3">
        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        Upload a larger cover
        <input type="file" accept={ACCEPT_ATTR} onChange={onUpload} className="hidden" />
      </label>

      {(error || externalError) && (
        <p className="font-body text-[11px] leading-relaxed mt-3" style={{ color: 'hsl(var(--neon-magenta))' }}>
          {error || externalError}
        </p>
      )}
    </div>
  );
}