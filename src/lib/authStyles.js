/**
 * The sign-in screens are built from the shared UI kit (Button, Input, the
 * code boxes). These class strings dress those pieces in the Stelli look —
 * pill buttons, rounded glass fields — without changing the kit itself, which
 * the admin page also uses. Each string is merged over the kit's own classes.
 */

/** A text field: the same rounded glass field as the quote and thread forms. */
export const authInput =
  'h-12 rounded-2xl border-white/[0.14] bg-white/[0.06] px-4 text-[15px] md:text-[15px] text-white shadow-none transition-colors placeholder:text-white/30 focus-visible:border-neon-lime focus-visible:ring-0';

/** A field with an icon sitting inside it on the left. */
export const authInputWithIcon = `${authInput} pl-11`;

/** The icon inside a field. */
export const authFieldIcon = 'pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35';

/** A field's label. */
export const authLabel = 'text-[12px] font-medium leading-none text-white/50';

/** The main action: a lime pill. */
export const authPrimary =
  'h-12 w-full rounded-full bg-neon-lime text-[15px] font-semibold text-ink shadow-none transition-[transform,filter] hover:bg-neon-lime hover:brightness-105 active:scale-[0.98]';

/** A second choice: a glass pill. */
export const authSecondary =
  'h-12 w-full rounded-full border border-white/[0.14] bg-white/[0.06] text-[15px] font-medium text-white shadow-none transition-colors hover:bg-white/[0.12] hover:text-white';

/** A text link inside the sign-in screens. */
export const authLink = 'font-medium text-neon-lime underline-offset-4 hover:underline';

/** Something went wrong: what happened, in one calm box. */
export const authNotice =
  'rounded-2xl border border-neon-magenta/30 bg-neon-magenta/10 px-4 py-3 text-[14px] leading-snug text-white';

/** Quiet helper text. */
export const authHint = 'text-[13px] leading-snug text-white/50';

/** The six code boxes, drawn as separate rounded glass tiles. */
export const otpGroup = 'gap-2';
export const otpSlot =
  'h-12 w-11 rounded-xl border border-white/[0.14] bg-white/[0.06] text-[18px] font-semibold text-white shadow-none first:rounded-xl first:border-l last:rounded-xl';
