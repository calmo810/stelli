import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

// Only needs to be resolved once per page load.
let checkedThisSession = false;

/**
 * Sends signed-in users who have not chosen CLIENT or CREATOR yet to /onboarding.
 * Admins bypass the gate so the app stays reachable for the owner.
 */
export default function RoleGate({ children }) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(checkedThisSession);

  useEffect(() => {
    if (checkedThisSession) return;
    let active = true;

    (async () => {
      try {
        const user = await base44.auth.me();
        if (!active) return;
        checkedThisSession = true;
        if (!user?.account_type && user?.role !== 'admin') {
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

  if (!ready) return <div className="min-h-screen bg-ink" />;
  return children;
}