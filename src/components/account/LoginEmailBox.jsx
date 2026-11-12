import React from 'react';
import { Card } from '@/components/system';

/** The address they log in with. Not editable: the platform owns it. */
export default function LoginEmailBox({ email, googleUser }) {
  return (
    <Card as="section" tone="sky" aria-labelledby="email-title">
      <h2 id="email-title" className="st-kicker">Login email</h2>
      {googleUser ? (
        <p className="st-body mt-2">You log in with Google. Your login email is your Google account.</p>
      ) : (
        <>
          <p className="mt-2 break-all text-[20px] font-extrabold tracking-[-0.03em]">{email}</p>
          <p className="st-small mt-1">This is the email you log in with.</p>
        </>
      )}
    </Card>
  );
}
