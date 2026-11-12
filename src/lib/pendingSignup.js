import { base44 } from '@/api/base44Client';
import { PRIVACY_VERSION, TERMS_VERSION } from '@/lib/legalDocuments';

/**
 * What someone chose on a sign-up form right before leaving for Google.
 *
 * A Google sign-up leaves the site and comes back as a brand-new account that
 * knows none of it: not whether they are a client or a creator, not that they
 * confirmed they are 18, not that they ticked the Terms. Those choices are
 * kept on the device here and put on the account the moment it comes back.
 *
 * Every sign-up form writes them through `rememberSignupChoices`, and they are
 * applied in exactly one place, `applyPendingSignup`, which the role gate and
 * the legal banner both wait for. (They used to be applied only on /portal, so
 * signing up with Google from a creator's booking form sent the person to
 * onboarding instead of back to their request, and the Terms they had just
 * accepted were asked for again.)
 */
const TYPE = 'stelli_pending_account_type';
const ADULT = 'stelli_pending_age_confirmed';
const LEGAL = 'stelli_pending_legal_acceptance';

const read = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key, value) => {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    /* a blocked store only means the account is asked again later */
  }
};

export function rememberSignupChoices({ accountType = '', adult = false, legal = false } = {}) {
  if (accountType) write(TYPE, accountType);
  if (adult) write(ADULT, 'true');
  if (legal) write(LEGAL, 'true');
}

/** The Terms were accepted on a form but the record did not land: try again on the next page. */
export function rememberLegalAcceptance() {
  write(LEGAL, 'true');
}

async function apply(user) {
  let account = user;
  const type = read(TYPE);
  const adult = read(ADULT) === 'true';
  const legal = read(LEGAL) === 'true';

  const changes = {};
  if (!account.account_type && ['client', 'creator'].includes(type)) changes.account_type = type;
  if (adult && !account.age_confirmed) changes.age_confirmed = true;
  if (Object.keys(changes).length) {
    try {
      account = (await base44.auth.updateMe(changes)) || { ...account, ...changes };
    } catch {
      // Not fatal: onboarding asks for anything still missing.
      return account;
    }
  }
  write(TYPE, '');
  write(ADULT, '');

  if (legal) {
    try {
      await Promise.all([
        base44.functions.invoke('recordAgreementAcceptance', { documentType: 'terms', documentVersion: TERMS_VERSION }),
        base44.functions.invoke('recordAgreementAcceptance', { documentType: 'privacy', documentVersion: PRIVACY_VERSION }),
      ]);
      write(LEGAL, '');
    } catch {
      // Left in place: the next page load tries again, and the banner covers it meanwhile.
    }
  }
  return account;
}

let inFlight = null;

/**
 * Puts any remembered sign-up choices on the signed-in account and returns the
 * account as it now stands. Safe to call from several places at once: they all
 * share one run.
 */
export function applyPendingSignup(user) {
  if (!user) return Promise.resolve(user);
  if (!read(TYPE) && !read(ADULT) && !read(LEGAL)) return Promise.resolve(user);
  if (!inFlight) {
    inFlight = apply(user).finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}
