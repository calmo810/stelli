import React, { useEffect, useRef, useState } from 'react';

/**
 * An <img> that arrives instead of popping in: decoded off the main thread,
 * then eased from a soft blur to full sharpness. Cached images show at once.
 */
export default function SmoothImage({ className = '', style = undefined, priority = false, onLoad = undefined, ...props }) {
  const ref = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, [props.src]);

  return (
    <img
      ref={ref}
      decoding="async"
      loading={priority ? 'eager' : 'lazy'}
      // React 18 only passes the lowercase attribute through to the DOM.
      // eslint-disable-next-line react/no-unknown-property
      fetchpriority={priority ? 'high' : 'auto'}
      draggable={false}
      {...props}
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
      className={`stelli-img ${loaded ? 'is-loaded' : ''} ${className}`}
      style={style}
    />
  );
}
