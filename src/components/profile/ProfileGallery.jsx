import React from 'react';

const REST_LAYOUTS = {
  ordered_grid: 'grid grid-cols-2 lg:grid-cols-3 gap-4',
  hero_grid: 'grid grid-cols-2 lg:grid-cols-3 gap-4',
  contact_sheet: 'grid grid-cols-3 lg:grid-cols-4 gap-2',
};

export default function ProfileGallery({ pinned = [], rest = [], galleryStyle, accent }) {
  if (!pinned.length && !rest.length) return null;

  const layout = REST_LAYOUTS[galleryStyle] || REST_LAYOUTS.hero_grid;
  const isSheet = galleryStyle === 'contact_sheet';

  return (
    <div className="space-y-14">
      {pinned.length > 0 && (
        <div>
          <p className="label-mono text-[9px] text-white/30 mb-5">Selected work</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {pinned.map((src, i) => (
              <div key={src} className="relative overflow-hidden" style={{ borderRadius: 4 }}>
                <img src={src} alt="" className="w-full aspect-[4/5] object-cover" />
                <span className="absolute top-3 left-3 label-mono text-[9px]" style={{ color: accent }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div>
          <p className="label-mono text-[9px] text-white/30 mb-5">Portfolio</p>
          <div className={layout}>
            {rest.map((src, i) => (
              <div
                key={src}
                className={`overflow-hidden ${galleryStyle === 'hero_grid' && i === 0 ? 'col-span-2' : ''}`}
                style={{ borderRadius: 4 }}
              >
                <img
                  src={src}
                  alt=""
                  className={`w-full object-cover ${isSheet ? 'aspect-square' : i === 0 && galleryStyle === 'hero_grid' ? 'aspect-[16/9]' : 'aspect-[4/5]'}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}