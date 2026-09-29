import React from 'react';

export default function StepPrivate({ w }) {
  return (
    <>
      <div className="field">
        <label className="lbl" htmlFor="fFull">
          Full name
        </label>
        <input
          id="fFull"
          className="inp"
          maxLength={60}
          value={w.s.fullName}
          autoComplete="name"
          onChange={(event) => w.patch({ fullName: event.target.value })}
        />
      </div>

      <div className="field">
        <label className="lbl" htmlFor="fEmail">
          Email
        </label>
        <input
          id="fEmail"
          className="inp"
          type="email"
          value={w.s.email}
          placeholder="you@elon.edu"
          autoComplete="email"
          onChange={(event) => w.patch({ email: event.target.value.trim() })}
        />
        <p className="hint">Where booking requests and updates go.</p>
      </div>

      <div className="inp-row" style={{ marginTop: 20 }}>
        <div className="field">
          <label className="lbl" htmlFor="fPhone">
            Phone <span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--faint)' }}>· optional</span>
          </label>
          <input
            id="fPhone"
            className="inp"
            inputMode="tel"
            maxLength={20}
            value={w.s.phone}
            autoComplete="tel"
            onChange={(event) => w.patch({ phone: event.target.value })}
          />
        </div>
        <div className="field">
          <label className="lbl" htmlFor="fIg">
            Instagram <span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--faint)' }}>· optional</span>
          </label>
          <div className="prefix-wrap">
            <span className="pre">@</span>
            <input
              id="fIg"
              className="inp"
              maxLength={30}
              value={w.s.ig}
              placeholder="handle"
              autoComplete="off"
              onChange={(event) => w.patch({ ig: event.target.value.replace(/^@+/, '').replace(/\s/g, '') })}
            />
          </div>
        </div>
      </div>
    </>
  );
}