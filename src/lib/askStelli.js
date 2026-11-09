import { base44 } from '@/api/base44Client';

/**
 * Asks the Stelli AI (the askStelli backend function) a question typed into the
 * FAQ phone. Works for everyone, signed in or not.
 *
 * @param {string} question
 * @param {{ history: { from: 'me' | 'them', text: string }[], sessionId: string }} context
 * @returns {Promise<{ bubbles: string[], links: { label: string, path: string }[] } | null>}
 *   null when the AI can't answer, so the phone uses its written answers instead.
 */
export async function askStelli(question, { history = [], sessionId } = {}) {
  try {
    const res = await base44.functions.invoke('askStelli', { question, history, sessionId });
    const data = res?.data ?? res;
    if (!data || !Array.isArray(data.bubbles) || !data.bubbles.length) return null;
    return {
      bubbles: data.bubbles.filter((b) => typeof b === 'string' && b.trim()),
      links: Array.isArray(data.links) ? data.links.filter((l) => l?.path?.startsWith('/') && l.label) : [],
    };
  } catch {
    return null;
  }
}
