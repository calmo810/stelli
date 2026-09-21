import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { LEGAL_VERSION } from '@/lib/legalDocuments';

/** Sends a signed-in person to the right place: creator portal, client portal, or role picker. */
export default function Portal() {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const user = await base44.auth.me();
        if (!active) return;

        // Google sign-ups agree to the legal terms before leaving the site; record it once they're back.
        if (localStorage.getItem('stelli_pending_legal_acceptance') === 'true') {
          localStorage.removeItem('stelli_pending_legal_acceptance');
          await Promise.all(['terms', 'privacy'].map(documentType =>
            base44.functions.invoke('recordAgreementAcceptance', { documentType, documentVersion: LEGAL_VERSION })
          )).catch(() => {});
        }

        if (user?.account_type === 'creator') navigate('/lensman-dashboard', { replace: true });
        else if (user?.account_type === 'client') navigate('/client-dashboard', { replace: true });
        else navigate('/onboarding', { replace: true });
      } catch {
        if (active) navigate('/login?returnTo=/portal', { replace: true });
      }
    })();
    return () => { active = false; };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'hsl(var(--neon-lime))' }} />
    </div>
  );
}
