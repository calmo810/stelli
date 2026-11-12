import React from 'react';
import SmoothImage from '@/components/shared/SmoothImage';

/** Thumbnails, two or three across, so the whole shoot is browsable at a glance. */
export default function AlbumGrid({ photos, onOpen }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
      {photos.map((photo, index) => (
        <button
          key={photo.id}
          type="button"
          onClick={() => onOpen(index)}
          aria-label={`Open photo ${index + 1} of ${photos.length}`}
          className="group relative aspect-square overflow-hidden rounded-[18px] border border-line bg-fill transition-transform duration-300 active:scale-[0.985]"
        >
          <SmoothImage
            src={photo.url}
            alt={photo.name || `Photo ${index + 1}`}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
          />
          <span className="pointer-events-none absolute inset-0 rounded-[18px] ring-0 ring-inset ring-white/0 transition-all duration-300 group-hover:ring-2 group-hover:ring-white/25" />
        </button>
      ))}
    </div>
  );
}