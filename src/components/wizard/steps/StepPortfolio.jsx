import React, { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { MAX_SHOTS, MIN_SHOTS, PH } from '@/lib/wizardData';

export default function StepPortfolio({ w }) {
  const { s } = w;
  const [dragIdx, setDragIdx] = useState(null);
  const [over, setOver] = useState(null);
  const [dropping, setDropping] = useState(false);
  const inputRef = useRef(null);

  const move = (from, to) => {
    if (to < 0 || to >= s.portfolio.length || from === to) return;
    const coverItem = s.portfolio[s.cover];
    const next = Array.from(s.portfolio);
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    w.patch({ portfolio: next, cover: Math.max(0, next.indexOf(coverItem)) });
  };

  const remove = (index) => {
    const coverItem = s.portfolio[s.cover];
    const next = s.portfolio.filter((_, i) => i !== index);
    const coverIdx = next.indexOf(coverItem);
    w.patch({ portfolio: next, cover: coverIdx < 0 ? 0 : coverIdx });
  };

  return (
    <>
      <div
        className={`pf-grid ${dropping ? 'drag' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDropping(true);
        }}
        onDragLeave={() => setDropping(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDropping(false);
          if (dragIdx != null) {
            move(dragIdx, s.portfolio.length - 1);
            setDragIdx(null);
            return;
          }
          if (event.dataTransfer.files?.length) w.uploadPortfolio(event.dataTransfer.files);
        }}
      >
        {s.portfolio.map((item, i) => (
          <div
            key={`${item.src}-${i}`}
            className={`pf-tile ${i === s.cover ? 'is-cover' : ''} ${dragIdx === i ? 'dragging' : ''} ${over === i ? 'over' : ''}`}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragEnd={() => {
              setDragIdx(null);
              setOver(null);
            }}
            onDragOver={(event) => {
              if (dragIdx == null) return;
              event.preventDefault();
              setOver(i);
            }}
            onDrop={(event) => {
              if (dragIdx == null) return;
              event.preventDefault();
              event.stopPropagation();
              move(dragIdx, i);
              setDragIdx(null);
              setOver(null);
            }}
          >
            <img src={item.src} alt="" />
            <span className="pf-num">{i + 1}</span>
            {i === s.cover && <span className="pf-cover-flag">Cover</span>}
            <div className="pf-ctrl">
              <div className="grp">
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move earlier">
                  ‹
                </button>
                <button type="button" onClick={() => move(i, i + 1)} disabled={i === s.portfolio.length - 1} aria-label="Move later">
                  ›
                </button>
              </div>
              <div className="grp">
                <button type="button" onClick={() => w.patch({ cover: i })} aria-label="Set as cover">
                  {i === s.cover ? '★' : '☆'}
                </button>
                <button type="button" onClick={() => remove(i)} aria-label="Remove">
                  ×
                </button>
              </div>
            </div>
          </div>
        ))}

        {s.portfolio.length < MAX_SHOTS && (
          <button type="button" className="pf-add" onClick={() => inputRef.current?.click()} disabled={w.uploading}>
            <Plus className="w-5 h-5" />
            {w.uploading ? 'Uploading…' : s.portfolio.length ? 'Add more' : 'Add shots'}
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => {
            w.uploadPortfolio(event.target.files);
            event.target.value = '';
          }}
        />
      </div>

      <div className="pf-status">
        <span className="meter">
          {Array.from({ length: MIN_SHOTS }, (_, i) => (
            <i key={i} className={i < s.portfolio.length ? 'on' : ''} />
          ))}
          <span style={{ marginLeft: 8 }}>
            {s.portfolio.length >= MIN_SHOTS ? (
              <>
                <b>{s.portfolio.length} shots</b> · minimum met
              </>
            ) : (
              `${s.portfolio.length} of ${MIN_SHOTS} minimum`
            )}
          </span>
        </span>
        <span>
          Drag or use ‹ › to reorder · max {MAX_SHOTS}
        </span>
      </div>
      <p className="hint">
        The first photo leads your page. Star another one to make it the cover —{' '}
        {PH.length ? 'your portfolio shows in the order above.' : ''}
      </p>
    </>
  );
}