import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { CONCIERGE_RULES, FIXED_LINKS } from '../../shared/concierge.ts';
import { hasDirectContact } from '../../shared/contactGuard.ts';

/**
 * The FAQ phone's brain. Open to anyone, signed in or not.
 *
 * In:  { question, history: [{ from: 'me' | 'them', text }], sessionId }
 * Out: { bubbles: string[], links: [{ label, path }] }  or  { bubbles: null } on failure,
 *      in which case the phone falls back to its written answers.
 *
 * Every question is logged to FaqQuestion so the founder can see what people ask.
 */

const MAX_QUESTION = 400;
const MAX_HISTORY = 10;
const PER_SESSION_PER_HOUR = 30;
const ALL_SESSIONS_PER_HOUR = 600;

const clean = (s: unknown, max: number) =>
  String(s ?? '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    // No markdown, and no angle brackets: a visitor can't close the <visitor>
    // tag and write "instructions" after it.
    .replace(/[*_`#<>]/g, '')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);

const firstName = (name: string) => String(name || '').trim().split(/\s+/)[0] || '';

export default async function (req: Request) {
  let base44;
  try {
    base44 = createClientFromRequest(req);
  } catch {
    return Response.json({ bubbles: null });
  }
  const db = base44.asServiceRole.entities;
  let question = '';
  let sessionId = 'anon';

  try {
    const body = await req.json().catch(() => ({}));
    question = clean(body.question, MAX_QUESTION);
    sessionId = clean(body.sessionId, 64) || 'anon';
    if (!question) return Response.json({ bubbles: null });

    const me = await base44.auth.me().catch(() => null);

    // Light rate limits, so an open endpoint can't run up the bill.
    const hourAgo = Date.now() - 3600_000;
    const recentMine = await db.FaqQuestion.filter({ session_id: sessionId }, '-created_date', PER_SESSION_PER_HOUR).catch(() => []);
    const mineThisHour = recentMine.filter((r: any) => new Date(r.created_date).getTime() > hourAgo).length;
    if (mineThisHour >= PER_SESSION_PER_HOUR) {
      return Response.json({
        bubbles: ["You've asked a lot this hour. For anything else, getstelli@gmail.com gets a real person."],
        links: [],
      });
    }
    const recentAll = await db.FaqQuestion.list('-created_date', ALL_SESSIONS_PER_HOUR).catch(() => []);
    if (recentAll.length >= ALL_SESSIONS_PER_HOUR && new Date(recentAll[recentAll.length - 1].created_date).getTime() > hourAgo) {
      return Response.json({ bubbles: null });
    }

    // Approved creators: only the public, non-price facts Stelli may talk about.
    // Never a creator on hold, and never their prices, payout state or IDs.
    const listed = await db.Lensman.filter({ status: 'approved' }, '-avg_rating', 60).catch(() => []);
    const creators = listed.filter((c: any) => !c.under_review);
    // Creators write these fields themselves. Anything that is really a phone
    // number, an email, a handle or a link is left out rather than repeated.
    const safe = (value: unknown, max: number) => {
      const text = clean(value, max);
      return hasDirectContact(text) ? '' : text;
    };
    const allowed = new Map<string, string>(Object.entries(FIXED_LINKS));
    const roster = creators
      .filter((c: any) => c.display_name)
      .map((c: any) => {
        const name = firstName(clean(c.display_name, 40));
        const profile = `/creators/${c.slug || c.id}`;
        const book = `/book/${c.id}`;
        allowed.set(profile, `See ${name}'s page`);
        allowed.set(book, `Request ${name}`);
        const facts = [
          `name: ${safe(c.display_name, 40) || 'A Stelli creator'}`,
          safe(c.one_liner, 140) && `about: ${safe(c.one_liner, 140)}`,
          Array.isArray(c.specialties) && c.specialties.length &&
            `shoots: ${c.specialties.slice(0, 6).map((v: unknown) => safe(v, 40)).filter(Boolean).join(', ')}`,
          Array.isArray(c.style_tags) && c.style_tags.length &&
            `style: ${c.style_tags.slice(0, 5).map((v: unknown) => safe(v, 24)).filter(Boolean).join(', ')}`,
          Array.isArray(c.neighborhoods) && c.neighborhoods.length &&
            `around: ${c.neighborhoods.slice(0, 4).map((v: unknown) => safe(v, 40)).filter(Boolean).join(', ')}`,
          Number(c.years_experience) > 0 && `experience: ${Math.round(Number(c.years_experience))} years`,
          c.review_count ? `rating: ${Number(c.avg_rating || 0).toFixed(1)} from ${c.review_count} reviews` : 'rating: new, no reviews yet',
          `profile path: ${profile}`,
          `request path: ${book}`,
        ].filter(Boolean);
        return `- ${facts.join(' | ')}`;
      })
      .join('\n');

    const history = (Array.isArray(body.history) ? body.history : [])
      .slice(-MAX_HISTORY)
      .map((m: any) => (m?.from === 'me' ? `<visitor>${clean(m.text, 600)}</visitor>` : `Stelli: ${clean(m?.text, 600)}`))
      .join('\n');

    const prompt = `${CONCIERGE_RULES}

APPROVED CREATORS
${roster || '(none listed right now)'}

ALLOWED LINKS (path: card label)
${[...allowed].map(([p, l]) => `${p}: ${l}`).join('\n')}

CONVERSATION SO FAR
${history || '(this is their first message)'}

NEW MESSAGE
<visitor>${question}</visitor>

Reply as Stelli.`;

    const out: any = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          bubbles: { type: 'array', items: { type: 'string' }, description: '1 to 3 short text bubbles' },
          links: {
            type: 'array',
            items: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
            description: 'Up to 2 paths from ALLOWED LINKS',
          },
        },
        required: ['bubbles'],
      },
    });

    const bubbles = (Array.isArray(out?.bubbles) ? out.bubbles : [])
      .map((b: unknown) => clean(b, 320))
      .filter(Boolean)
      .slice(0, 3);
    if (!bubbles.length) throw new Error('empty reply');

    // The rules are also checked on the way out. A reply that names a price or
    // hands over a way to reach someone (other than Stelli's own address) is
    // dropped, and the phone falls back to its written answers.
    const reply = bubbles.join(' ').replace(/getstelli@gmail\.com/gi, '');
    if (/\$\s?\d/.test(reply) || hasDirectContact(reply)) throw new Error('reply broke a hard rule');

    const seen = new Set<string>();
    const links = (Array.isArray(out?.links) ? out.links : [])
      .map((l: any) => String(l?.path || '').trim())
      .filter((p: string) => allowed.has(p) && !seen.has(p) && seen.add(p))
      .slice(0, 2)
      .map((path: string) => ({ path, label: allowed.get(path) }));

    await db.FaqQuestion.create({
      session_id: sessionId,
      question,
      answer: bubbles.join('\n'),
      links: links.map((l: any) => l.path),
      source: 'ai',
      signed_in: Boolean(me),
    }).catch((e: Error) => console.error('FaqQuestion log failed:', e.message));

    return Response.json({ bubbles, links });
  } catch (error) {
    console.error('askStelli error:', (error as Error).message);
    if (question) {
      // the phone shows its written fallback; log it so the miss is visible
      await db.FaqQuestion.create({ session_id: sessionId, question, source: 'fallback' }).catch(() => {});
    }
    return Response.json({ bubbles: null });
  }
}
