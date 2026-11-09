import { base44 } from '@/api/base44Client';

/**
 * The Stelli agent behind the FAQ phone. One conversation per visitor, kept
 * alive while they stay on the page; `resetConversation` starts a fresh thread.
 */
const AGENT_NAME = 'stelli_concierge';
let conversation = null;

export function resetConversation() {
  conversation = null;
}

async function thread() {
  if (conversation) return conversation;
  conversation = await base44.agents.createConversation({
    agent_name: AGENT_NAME,
    metadata: { name: 'FAQ question', description: 'A question typed into the FAQ phone' },
  });
  return conversation;
}

/** Assistant text arrives in streams; wait until it stops changing. */
function settle(content) {
  return content
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/[*_`#]/g, '')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

/**
 * @returns {Promise<string>} Stelli's reply.
 * Throws when there is no signed-in visitor or the agent does not answer.
 */
export async function askStelli(question) {
  const signedIn = await base44.auth.isAuthenticated();
  if (!signedIn) throw new Error('sign_in_required');

  const conv = await thread();

  return new Promise((resolve, reject) => {
    let settled = false;
    let latest = '';
    let quiet = null;
    let unsubscribe = () => {};

    const finish = (text) => {
      if (settled) return;
      settled = true;
      clearTimeout(quiet);
      clearTimeout(deadline);
      unsubscribe();
      if (text) resolve(text);
      else reject(new Error('no_reply'));
    };

    const deadline = setTimeout(() => finish(latest), 30000);

    unsubscribe = base44.agents.subscribeToConversation(conv.id, (data) => {
      const messages = data?.messages || [];
      const last = [...messages].reverse().find((m) => m.role === 'assistant');
      if (!last?.content) return;
      latest = settle(last.content);
      clearTimeout(quiet);
      quiet = setTimeout(() => finish(latest), 900);
    });

    Promise.resolve(base44.agents.addMessage(conv, { role: 'user', content: question })).catch((error) => {
      if (settled) return;
      settled = true;
      clearTimeout(quiet);
      clearTimeout(deadline);
      unsubscribe();
      reject(error);
    });
  });
}