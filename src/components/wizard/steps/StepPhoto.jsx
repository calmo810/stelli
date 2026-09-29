import React, { useRef, useState } from 'react';
import { User } from 'lucide-react';

export default function StepPhoto({ w }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  return (
    <div className="photo-zone">
      <div className={`ava ${w.s.photo ? 'has' : ''}`}>
        {w.s.photo ? <img src={w.s.photo} alt="Your profile photo" /> : <User className="w-11 h-11" />}
      </div>

      <div
        className={`drop ${drag ? 'drag' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDrag(false);
          w.uploadPhoto(event.dataTransfer.files?.[0]);
        }}
      >
        <p>{w.s.photo ? 'Looking good. Want a different one?' : 'Drag a photo here, or'}</p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => inputRef.current?.click()} disabled={w.uploading}>
          {w.uploading ? 'Uploading…' : w.s.photo ? 'Replace photo' : 'Choose photo'}
        </button>
        {w.s.photo && (
          <div style={{ marginTop: 8 }}>
            <button type="button" className="link-btn" style={{ color: 'var(--dim)' }} onClick={() => w.patch({ photo: null })}>
              Remove
            </button>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            w.uploadPhoto(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
      </div>
    </div>
  );
}