/**
 * The profile wizard's own furniture: its chapters, its thirteen steps and the
 * starter styles. Everything about the profile itself (the choices, the
 * limits, the form and how it saves) lives in lib/creatorProfile.js.
 */
import { MIN_SHOTS, PROMPTS } from '@/lib/creatorProfile';

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

/** Starter styles: they fill the creator's own fields, which they then rewrite. */
export const STARTERS = [
  {
    key: 'flash', name: 'Night Flash', color: '#d6f344',
    art: 'radial-gradient(circle at 30% 40%,#d6f34455,transparent 55%),radial-gradient(circle at 80% 70%,#4fd8e033,transparent 50%),#10141f',
    tags: ['direct flash', 'nightlife', 'candid'], oneLiner: "Flash on, hands up, we'll fix it in the blur.",
    theme: 'night', accent: 'lime', gallery: 'hero', what: ['Nightlife', 'Events', 'Portraits'],
    layout: 'wall', curve: 'full', frame: 'mat', mat: 'ink', captions: true,
    bio: 'I shoot mostly at night and keep it relaxed. Show up, be yourself, I\'ll handle the rest.',
    prompt: PROMPTS[4], promptA: 'you want photos that look like the night actually felt.', dont: 'No weddings or newborns.',
  },
  {
    key: 'golden', name: 'Golden Hour', color: '#4fd8e0',
    art: 'radial-gradient(circle at 70% 30%,#f5c26b55,transparent 55%),radial-gradient(circle at 20% 80%,#4fd8e033,transparent 50%),#f6f6f2',
    tags: ['golden hour', 'candid', 'bright & airy'], oneLiner: 'Golden hour believer. Your mom will cry (good tears).',
    theme: 'clean', accent: 'cyan', gallery: 'ordered', what: ['Graduation', 'Couples', 'Portraits'],
    layout: 'wall', curve: 'soft', frame: 'mat', mat: 'paper', captions: true,
    bio: 'Warm, easy sessions built around real moments. I direct just enough that you never feel stiff.',
    prompt: PROMPTS[1], promptA: 'the photos felt like us, not a photoshoot.', dont: 'No late-night events.',
  },
  {
    key: 'film', name: 'Film Editorial', color: '#e356c4',
    art: 'radial-gradient(circle at 25% 30%,#e356c455,transparent 55%),radial-gradient(circle at 80% 80%,#7b3ff244,transparent 50%),#10141f',
    tags: ['film', 'editorial', 'moody'], oneLiner: 'Film first. Digital when the brief calls for it.',
    theme: 'night', accent: 'magenta', gallery: 'contact', what: ['Editorial', 'Music Videos', 'Commercial'],
    layout: 'strip', curve: 'flat', frame: 'bleed', mat: 'mixed', captions: false,
    bio: 'Editorial eye, run-and-gun energy. I plan the shot list so your shoot day is pure execution.',
    prompt: PROMPTS[0], promptA: 'a rooftop at blue hour with a smoke machine.', dont: 'Nothing corporate-stiff.',
  },
];
