import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applyPendingSignup } from '@/lib/pendingSignup';
import { queryClientInstance } from '@/lib/query-client';
import { CURRENT_USER_KEY, fetchCurrentUser } from '@/hooks/useCurrentUser';

// Only needs to be resolved once per page load.
let checkedThisSession = false;

/**
 * Sends signed-in users who have not chosen CLIENT or CREATOR yet to /onboarding.
 * Admins bypass the gate so the app stays reachable for the owner.
 *
 * Choices made on a sign-up form before a trip to Google are put on the
 * account first, so someone who already picked a side is never asked again.
 */
export default function RoleGate({ children }) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(checkedThisSession);

  useEffect(() => {
    if (checkedThisSession) return;
    let active = true;

    (async () => {
      try {
        const user = await applyPendingSignup(await fetchCurrentUser());
        if (!active) return;
        checkedThisSession = true;
        // Every screen shares this account from here on.
        queryClientInstance.setQueryData(CURRENT_USER_KEY, user);
        // Nobody signed in: nothing to gate, the public site is theirs to browse.
        if (user && !user.account_type && user.role !== 'admin') {
          navigate('/onboarding', { replace: true });
        } else {
          setReady(true);
        }
      } catch {
        if (active) {
          checkedThisSession = true;
          setReady(true);
        }
      }
    })();

    return () => { active = false; };
  }, [navigate]);

  if (!ready) return <div className="min-h-screen bg-ink" aria-busy="true" />;
  return children;
}
