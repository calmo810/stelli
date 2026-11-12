import React from 'react';
import { Field } from './Field';

/** The private part: how Stelli reaches the creator. Clients never see it. */
export default function ContactSection({ form, set, applying = false }) {
  return (
    <div className="cf-stack">
      <Field label="Full name" htmlFor="cfFull">
        <input
          id="cfFull"
          className="cf-input"
          maxLength={60}
          value={form.fullName}
          autoComplete="name"
          onChange={(event) => set({ fullName: event.target.value })}
        />
      </Field>

      <Field label="Email" htmlFor="cfEmail">
        <input
          id="cfEmail"
          className="cf-input"
          type="email"
          value={form.email}
          placeholder="you@elon.edu"
          autoComplete="email"
          onChange={(event) => set({ email: event.target.value.trim() })}
        />
      </Field>

      <div className="cf-row">
        <Field label="Phone" note="Optional" htmlFor="cfPhone">
          <input
            id="cfPhone"
            className="cf-input"
            inputMode="tel"
            maxLength={20}
            value={form.phone}
            autoComplete="tel"
            onChange={(event) => set({ phone: event.target.value })}
          />
        </Field>
        <Field label="Instagram" note="Optional" htmlFor="cfIg">
          <div className="cf-prefix">
            <span>@</span>
            <input
              id="cfIg"
              className="cf-input"
              maxLength={30}
              value={form.ig}
              placeholder="handle"
              autoComplete="off"
              onChange={(event) => set({ ig: event.target.value.replace(/^@+/, '').replace(/\s/g, '') })}
            />
          </div>
        </Field>
      </div>

      {applying && (
        <p className="cf-hint">
          By sending your application you agree to Stelli's{' '}
          <a href="/terms" target="_blank" rel="noreferrer">
            Terms and Privacy Policy
          </a>
          .
        </p>
      )}
    </div>
  );
}
