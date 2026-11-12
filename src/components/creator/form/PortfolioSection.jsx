import React, { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { MAX_SHOTS, MIN_SHOTS } from '@/lib/creatorProfile';

/** The portfolio: add, reorder, pick the cover, remove. */
export default function PortfolioSection({ form, set, uploads }) {
  const input = useRef(null);
  const [dropping, setDropping] = useState(false);
  const shots = form.portfolio;

  const move = (from, to) => {
    if (to < 0 || to >= shots.length) return;
    const coverItem = shots[form.cover];
    const next = [...shots];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    set({ portfolio: next, cover: Math.max(0, next.indexOf(coverItem)) });
  };

  const remove = (index) => {
    const coverItem = shots[form.cover];
    const next = shots.filter((_, i) => i !== index);
    set({ portfolio: next, cover: Math.max(0, next.indexOf(coverItem)) });
  };

  const add = (files) => uploads.uploadPortfolio(files, shots.length);

  return (
    <div>
      <div
        className="cf-shots"
        onDragOver={(event) => {
          event.preventDefault();
          setDropping(true);
        }}
        onDragLeave={() => setDropping(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDropping(false);
          if (event.dataTransfer.files?.length) add(event.dataTransfer.files);
        }}
      >
        {shots.map((shot, i) => (
          <div key={shot.src} className={`cf-shot ${i === form.cover ? 'is-cover' : ''}`}>
            <img src={shot.src} alt="" loading="lazy" />
            {i === form.cover && <span className="cf-shot__flag">Cover</span>}
            <div className="cf-shot__bar">
              <span>
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move earlier">
                  ‹
                </button>
                <button type="button" onClick={() => move(i, i + 1)} disabled={i === shots.length - 1} aria-label="Move later">
                  ›
                </button>
              </span>
              <span>
                <button type="button" onClick={() => set({ cover: i })} aria-label="Make this the cover">
                  {i === form.cover ? '★' : '☆'}
                </button>
                <button type="button" onClick={() => remove(i)} aria-label="Remove">
                  ×
                </button>
              </span>
            </div>
          </div>
        ))}

        {shots.length < MAX_SHOTS && (
          <button
            type="button"
            className={`cf-shot-add ${dropping ? 'is-drop' : ''}`}
            onClick={() => input.current?.click()}
            disabled={uploads.uploading}
          >
            <Plus className="h-5 w-5" />
            {uploads.uploading ? uploads.note || 'Uploading…' : shots.length ? 'Add more' : 'Add photos'}
          </button>
        )}
      </div>

      <input
        ref={input}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        hidden
        onChange={(event) => {
          add(event.target.files);
          event.target.value = '';
        }}
      />

      <p className="cf-hint">
        {shots.length >= MIN_SHOTS
          ? `${shots.length} of ${MAX_SHOTS}. Your first three lead your page.`
          : `${shots.length} of ${MIN_SHOTS} needed.`}{' '}
        Big files are fine: we resize them as they upload.
      </p>
    </div>
  );
}
