import React from 'react';

/** The calm white panel an empty creator list gets. */
export default function WorkspaceEmpty({ icon: Icon, title, body, cta = null }) {
  return (
    <div className="wk-card wk-empty">
      {Icon && (
        <span className="wk-fill wk-empty__icon">
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </span>
      )}
      <div className="wk-empty__copy">
        <p className="wk-title">{title}</p>
        {body && <p className="wk-body">{body}</p>}
        {cta && <div className="mt-4">{cta}</div>}
      </div>
    </div>
  );
}