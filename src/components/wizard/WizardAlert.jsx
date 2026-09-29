import React from 'react';

/** The small two-button question, used before anything destructive. */
export default function WizardAlert({ w }) {
  const { confirm } = w;
  if (!confirm) return null;
  return (
    <div className="alert-back">
      <div className="alert" role="alertdialog" aria-labelledby="alT">
        <div className="alert-body">
          <h4 id="alT">{confirm.title}</h4>
          <p>{confirm.text}</p>
        </div>
        <div className="alert-btns">
          <button type="button" onClick={() => w.setConfirm(null)}>
            Cancel
          </button>
          <button type="button" onClick={confirm.onYes}>
            {confirm.yes}
          </button>
        </div>
      </div>
    </div>
  );
}