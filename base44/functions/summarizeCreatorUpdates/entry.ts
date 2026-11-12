import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

/** A creator may ask for a fresh note this often. */
const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = 30;
const MAX_FACTS = 8;
const MAX_FACT_CHARS = 180;
const seen = new Map();

/**
 * The optional "what's new" note at the top of the creator workspace: two plain
 * sentences over the few facts the dashboard already knows. The page shows its
 * own list whenever this returns nothing.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth
      .me()
      .catch((error) => (error?.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ summary: null });

    const now = Date.now();
    const recent = (seen.get(user.id) || []).filter((at) => now - at < WINDOW_MS);
    if (recent.length >= LIMIT) return Response.json({ summary: null });
    seen.set(user.id, [...recent, now]);
    if (seen.size > 5000) seen.clear();

    const body = await req.json().catch(() => ({}));
    const facts = (Array.isArray(body?.facts) ? body.facts : [])
      .map((fact) => String(fact || '').replace(/\s+/g, ' ').trim().slice(0, MAX_FACT_CHARS))
      .filter(Boolean)
      .slice(0, MAX_FACTS);
    if (!facts.length) return Response.json({ summary: null });

    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: [
        "You write the short \"what's new\" note at the top of a photographer's Stelli dashboard.",
        'Use only the facts listed below. Speak to the photographer as "you".',
        'Name the most urgent thing first, and be concrete: use the numbers and dates given.',
        'At most 35 words, two short sentences in plain, everyday language.',
        'Keep money written as $420. No greeting, no sign-off, no bullet points, no emoji, no exclamation marks.',
        `Photographer: ${String(user.full_name || '').split(' ')[0] || 'creator'}.`,
        'Facts:',
        ...facts.map((fact) => `- ${fact}`),
      ].join('\n'),
      response_json_schema: {
        type: 'object',
        properties: { summary: { type: 'string' } },
        required: ['summary'],
      },
    });

    const summary = String(response?.summary || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 320);

    return Response.json({ summary: summary || null });
  } catch (error) {
    console.error('summarizeCreatorUpdates error:', error?.message);
    return Response.json({ summary: null });
  }
}