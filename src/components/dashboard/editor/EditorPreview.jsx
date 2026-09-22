import React from 'react';
import { accentColor, coverImage, focalPoint, galleryComposition } from '@/lib/profilePresets';

export default function EditorPreview({ form, fallbackName }) {
  const accent = accentColor(form.accent_color);
  const creator = { portfolio_images: form.portfolio_images, pinned_images: form.pinned_images, cover_image: form.cover_image };
  const cover = coverImage(creator);
  const focal = focalPoint(creator);
  const { pinned } = galleryComposition(creator);
  const tags = (form.style_tags || []).slice(0, 3);

  return (
    <div className="border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.1)', borderRadius: 4, background: 'hsl(var(--ink))' }}>
      <div className="relative w-full aspect-[3/2] bg-surface-2 overflow-hidden">
        {cover ? (
          <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: `${focal.x}% ${focal.y}%` }} />
        ) : null}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, hsl(var(--ink)) 0%, transparent 70%)' }} />
      </div>

      <div className="p-5">
        <p className="font-heading text-[26px] font-semibold text-white leading-tight">
          {form.display_name || fallbackName}
        </p>
        <p className="font-heading text-[13px] font-normal text-white/60 mt-1.5">
          {form.one_liner || tags.join(' · ') || 'your style · your city'}
        </p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {tags.map((tag) => (
              <span key={tag} className="label-mono text-[8px] px-2.5 py-1 border" style={{ borderColor: accent, color: accent, borderRadius: 999 }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {form.dont_shoot && (
          <div className="mt-5">
            <p className="label-mono text-[8px] text-white/30 mb-1">Doesn't shoot</p>
            <p className="font-body text-[11px] text-white/55 leading-relaxed">{form.dont_shoot}</p>
          </div>
        )}

        {pinned.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5 mt-5">
            {pinned.map((src, i) => (
              <div key={src} className="relative overflow-hidden" style={{ borderRadius: 3 }}>
                <img src={src} alt="" className="w-full aspect-[4/5] object-cover" />
                <span className="absolute top-1 left-1 label-mono text-[8px]" style={{ color: accent }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
        )}

        {form.prompt_question && form.prompt_answer && (
          <div className="border-t border-white/10 mt-5 pt-5">
            <p className="label-mono text-[8px] mb-2" style={{ color: accent }}>{form.prompt_question}</p>
            <p className="font-heading text-[16px] text-white leading-snug">{form.prompt_answer}</p>
          </div>
        )}
      </div>
    </div>
  );
}