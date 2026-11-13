import React from 'react';

/** The phone frame the profile preview lives in. */
export default function WizardPhone({ children }) {
  return (
    <div className="phone">
      {/* It scrolls on its own, so it can take the keyboard focus too. */}
      <div className="phone-screen" tabIndex={0} role="region" aria-label="Preview of your page">
        <div className="phone-island" />
        {children}
      </div>
    </div>
  );
}