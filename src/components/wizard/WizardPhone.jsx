import React from 'react';

/** The phone frame the profile preview lives in. */
export default function WizardPhone({ children }) {
  return (
    <div className="phone">
      <div className="phone-screen">
        <div className="phone-island" />
        {children}
      </div>
    </div>
  );
}