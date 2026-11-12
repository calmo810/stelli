import React from 'react';
import StepWhat from './StepWhat';
import StepWhere from './StepWhere';

/** What they shoot (needed) and where on campus (optional), on one screen. */
export default function StepWork({ w }) {
  return (
    <>
      <StepWhat w={w} />
      <span className="lbl subhead">Where on campus · optional</span>
      <StepWhere w={w} />
    </>
  );
}
