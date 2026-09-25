import React from "react";
import BackButton from '@/components/shared/BackButton';
import Surface from '@/components/shared/Surface';

/** One quiet column for every sign-in screen, on the same ink canvas. */
export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4 py-20">
      <BackButton />
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-9">
          {Icon && (
            <span className="mb-5 inline-grid place-items-center w-11 h-11 rounded-full border border-white/10 text-neon-lime">
              <Icon className="w-5 h-5" strokeWidth={1.6} aria-hidden="true" />
            </span>
          )}
          <h1 className="text-[26px] font-semibold tracking-[-0.01em] text-white">{title}</h1>
          {subtitle && <p className="mt-2 text-[14px] leading-relaxed text-white/45">{subtitle}</p>}
        </div>

        <Surface className="p-7 md:p-8">{children}</Surface>

        {footer && <p className="mt-6 text-center text-[14px] text-white/45">{footer}</p>}
      </div>
    </div>
  );
}