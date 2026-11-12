import React from 'react';
import SectionLabel from '@/components/creator/SectionLabel';
import GoogleIcon from '@/components/GoogleIcon';

/** The address they log in with. Not editable — the platform owns it. */
export default function LoginEmailBox({ email, googleUser }) {
  return (
    <section>
      <SectionLabel>Login email</SectionLabel>
      <div className="glass rounded-3xl px-[18px] py-4">
        {googleUser ? (
          <div className="flex items-center gap-3.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/[0.08]">
              <GoogleIcon className="h-5 w-5" />
            </span>
            <p className="text-[15px] leading-snug text-white/75">
              You log in with Google. Your login email is your Google account.
            </p>
          </div>
        ) : (
          <>
            <p className="truncate text-[17px] font-medium text-white">{email}</p>
            <p className="mt-1 text-[13px] text-white/45">This is the email you log in with.</p>
          </>
        )}
      </div>
    </section>
  );
}
