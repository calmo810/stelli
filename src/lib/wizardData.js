/**
 * The profile wizard's own furniture: its chapters, its steps and the short
 * route an application takes through them. Everything about the profile
 * itself (the choices, the limits, the form and how it saves) lives in
 * lib/creatorProfile.js.
 */
import { MIN_SHOTS } from '@/lib/creatorProfile';

/** Faded placeholder frames, shown in the preview until real photos land. */
export const PH = [
  'linear-gradient(135deg,#2b3350,#141a2c)', 'linear-gradient(135deg,#41305a,#1a1430)',
  'linear-gradient(135deg,#1f4a4e,#0e2126)', 'linear-gradient(135deg,#4e3a22,#211609)',
  'linear-gradient(135deg,#24405f,#0d1826)', 'linear-gradient(135deg,#4a2440,#1c0d1a)',
];

export const CHAPTERS = ['You', 'Your Work', 'Pricing', 'Your Style', 'The Look', 'Private'];

export const STEPS = [
  { ch: 0, key: 'photo', title: 'Put a face to the flash.', sub: 'Clients book people. A clear, recent photo of you, not your best landscape.', need: true },
  { ch: 0, key: 'name', title: 'What should clients call you?', sub: 'First name is fine. Your profile link updates as you type.', required: true },
  { ch: 0, key: 'line', title: 'One line. Make it count.', sub: 'This sits right under your name. Add up to three style tags too.', optional: true },
  { ch: 1, key: 'where', title: 'Where do you like to shoot?', sub: "Tap every campus spot you're up for. Clients filter by this.", required: true },
  { ch: 1, key: 'what', title: 'What do you shoot?', sub: "Pick everything that applies. It's the first thing clients search.", required: true },
  { ch: 1, key: 'pf', title: 'Show your best work.', sub: `Add at least ${MIN_SHOTS}. The first three lead your page, and the star picks your cover.`, need: true },
  { ch: 2, key: 'price', title: 'Set your packages.', sub: 'Three tiers so you have a starting point for every quote. Only you and Stelli see these. Clients get a private quote from you.', need: true },
  { ch: 3, key: 'bio', title: 'How do you shoot?', sub: 'Two or three sentences on your style and what it is like to work with you.', optional: true },
  { ch: 3, key: 'kit', title: "What's in the bag?", sub: 'Camera, lenses, lighting. Keep it short.', optional: true },
  { ch: 3, key: 'prompt', title: 'Pick a prompt.', sub: 'A little personality goes a long way. Choose one and finish the sentence.', optional: true },
  { ch: 3, key: 'dont', title: "What don't you shoot?", sub: 'Saying no saves you and the client a bad match.', optional: true },
  { ch: 4, key: 'look', title: 'Hang your work.', sub: 'Choose how your photos hang on your public page. Only you set this. Clients see it exactly as you leave it.' },
  { ch: 5, key: 'priv', title: 'Just between us.', sub: 'Only Stelli sees this. Clients get in touch through Stelli bookings.', required: true },
];

export const stepIdx = (key) => STEPS.findIndex((s) => s.key === key);

/**
 * The quickest way to a page, for someone applying: the six things Stelli needs
 * to review an application, easiest first. Every other step is an extra,
 * reached from the review page, and the whole list is open when editing.
 */
export const APPLY_FLOW = ['name', 'what', 'where', 'pf', 'photo', 'priv'];
