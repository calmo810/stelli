import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

/**
 * The plain-words reason a request failed.
 *
 * Backend functions answer a refused request with { error: "why" } and a 4xx
 * status. The SDK throws that as a bare "Request failed with status code 400",
 * with the real sentence tucked away in error.response.data. This digs it out,
 * so every screen shows the reason the server gave.
 */
export function errorMessage(error, fallback = 'Something went wrong. Try again.') {
  const data = error?.response?.data;
  const fromServer = typeof data?.error === 'string' ? data.error : data?.error?.message || data?.message || data?.detail;
  if (fromServer) return String(fromServer);
  const message = String(error?.message || '');
  if (/^Network Error|timeout of/i.test(message)) return "We couldn't reach Stelli. Check your connection and try again.";
  // Never show a raw transport error to a person.
  if (!message || /^Request failed with status code/i.test(message)) return fallback;
  return message;
}

// Every backend function call goes through here, so a refused call throws an
// error whose message is the server's own sentence. Code that reads
// `error.message` in a catch gets the right words without each screen having to
// know where the SDK keeps them.
const invoke = base44.functions.invoke.bind(base44.functions);
base44.functions.invoke = async (name, data) => {
  try {
    return await invoke(name, data);
  } catch (error) {
    if (error && typeof error === 'object') error.message = errorMessage(error);
    throw error;
  }
};
