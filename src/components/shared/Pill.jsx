import React from 'react';

const TONES = {
  cyan: 'st-btn--primary',
  lime: 'st-btn--lime',
  soft: 'st-btn--soft',
};

/** A small pill button in the design system's shape. Kept for the places that pass their own tag. */
export default function Pill({ as: Tag = 'span', tone = 'cyan', className = '', ...rest }) {
  return <Tag className={`st-btn st-btn--sm shrink-0 ${TONES[tone] || TONES.cyan} ${className}`} {...rest} />;
}
