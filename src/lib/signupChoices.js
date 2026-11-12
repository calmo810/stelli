import { base44 } from '@/api/base44Client';

/**
 * What someone chose on the signup page before leaving for Google: which kind
 * of account, and that they are an adult. Google sends them back with a bare
 * account, so the first page they land on applies those choices. Both the
 * portal and the creator application are landing pages, so both call this.
 *
 * Returns the user, updated if anything changed. Never throws: a page that
 * needs the account type asks for it again if it is still missing.
 */
export async function applyPendingSignupChoices(user) {
  if (!user) return user;
  let current = user;
  try {
    const pendingRole = localStorage.getItem('stelli_pending_account_type');
    const pendingAdult = localStorage.getItem('stelli_pending_age_confirmed') === 'true';
    const changes = {};
    if (!current.account_type && ['client', 'creator'].includes(pendingRole)) changes.account_type = pendingRole;
    if (pendingAdult && !current.age_confirmed) changes.age_confirmed = true;
    if (Object.keys(changes).length) current = (await base44.auth.updateMe(changes)) || { ...current, ...changes };
    localStorage.removeItem('stelli_pending_account_type');
    localStorage.removeItem('stelli_pending_age_confirmed');
  } catch {
    // Not fatal.
  }
  return current;
}
