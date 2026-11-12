import React from 'react';
import StepPhoto from './StepPhoto';
import StepName from './StepName';

/** Who the client is booking: a face and a name, on one screen. */
export default function StepYou({ w }) {
  return (
    <>
      <StepPhoto w={w} />
      <div style={{ marginTop: 28 }}>
        <StepName w={w} />
      </div>
    </>
  );
}
