import React from 'react';

/** The calm white panel an empty creator list gets. */
export default function WorkspaceEmpty({ icon: Icon, title, body, cta = null, tone = 'surface' }) {
  const workbench = tone === 'workbench';

  return (
    <div className={workbench ? 'wk-card wk-empty' : 'wk-card flex min-h-[190px] flex-col items-center justify-center px-6 py-8 text-center'}>
      {Icon && (
        <span className={workbench ? 'wk-fill wk-empty__icon' : 'wk-fill mb-3 grid h-11 w-11 place-items-center rounded-2xl wk-grey'}>
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </span>
      )}
      <div className={workbench ? 'wk-empty__copy' : ''}>
        <p className="wk-title">{title}</p>
        {body && <p className={workbench ? 'wk-body' : 'wk-body mt-1.5 max-w-[300px]'}>{body}</p>}
        {cta && <div className="mt-4">{cta}</div>}
      </div>
    </div>
  );
}