import React from 'react';

/** The address they log in with. Not editable — the platform owns it. */
export default function LoginEmailBox({ email, googleUser }) {
  return (
    <section
      className="border p-6"
      style={{ background: 'hsl(var(--surface))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 4 }}
    >
      <h2 className="font-heading text-2xl font-semibold text-white mb-5">Login email</h2>

      {googleUser ? (
        <p className="font-body text-[14px] text-white/70">
          You log in with Google. Your login email is your Google account.
        </p>
      ) : (
        <>
          <p className="font-body text-[15px] text-white">{email}</p>
          <p className="font-body text-[11px] text-white/50 mt-2">This is the email you log in with.</p>
        </>
      )}
    </section>
  );
}