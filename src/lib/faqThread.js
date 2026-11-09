/**
 * The FAQ, as the thread on the FAQ page answers it. Answers follow the Stelli
 * Terms — keep them in sync if the policy changes.
 *
 * `keys` are the words that route a typed question to this answer, so people
 * can ask in their own words instead of only tapping a suggestion.
 */
export const FAQ_THREAD = [
  {
    q: 'How much does it cost?',
    a: 'Every creator sends you a private quote after you request. No price tags on the site.',
    keys: ['cost', 'price', 'pricing', 'how much', 'expensive', 'cheap', 'rate', 'quote', 'charge', 'fee', 'budget', '$'],
  },
  {
    q: 'When do I pay?',
    a: 'When you accept the quote. We hold your money until your photos are delivered.',
    keys: ['pay', 'payment', 'deposit', 'card', 'venmo', 'upfront', 'up front', 'escrow', 'hold'],
  },
  {
    q: 'How fast do I get photos?',
    a: 'Your unedited set in 2–3 business days. Edits within a week.',
    keys: ['fast', 'how long', 'turnaround', 'deliver', 'when do i get', 'when will i get', 'edits', 'edited', 'wait', 'days', 'quick'],
  },
  {
    q: 'Can I cancel?',
    a: 'Yes. Cancel 72+ hours before the shoot for a full refund. Closer than that, the creator keeps part of it.',
    keys: ['cancel', 'refund', 'reschedule', 'change my date', 'back out', 'money back'],
  },
  {
    q: 'Who are the creators?',
    a: 'Vetted photographers and filmmakers. We approve every profile before it goes live.',
    keys: ['who', 'creator', 'photographer', 'videographer', 'filmmaker', 'vetted', 'legit', 'safe', 'trust', 'students'],
  },
  {
    q: 'Do I own the photos?',
    a: "Yes, once you've paid. The creator needs your OK before posting them.",
    keys: ['own', 'rights', 'copyright', 'post them', 'instagram', 'portfolio', 'usage', 'license', 'share'],
  },
];

export const FAQ_EMAIL = 'getstelli@gmail.com';

/** Pick a reply for something typed into the message field. */
export function replyTo(text) {
  const t = ` ${text.toLowerCase().replace(/[’']/g, "'")} `;
  const has = (k) => (/^\w/.test(k) ? new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(t) : t.includes(k));
  let best = null;
  let bestScore = 0;
  for (const item of FAQ_THREAD) {
    const score = item.keys.reduce((n, k) => n + (has(k) ? k.length : 0), 0);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  if (best) return { text: best.a, faq: best.q };
  if (/\b(thanks|thank you|thx|ty|appreciate)\b/.test(t)) return { text: 'Anytime! 🙌' };
  if (/\b(hi|hey|hello|yo|sup|hiya)\b/.test(t)) return { text: 'Hey! 👋 Ask me anything about booking, or tap a question below.' };
  if (/\b(book|booking|request|start|sign up|join)\b/.test(t))
    return { text: 'Pick a creator on the Creators page and hit Request. They send you a private quote, usually within a day.' };
  return {
    text: `Good one. I don't have that answer handy, but a real person does: ${FAQ_EMAIL}`,
  };
}
