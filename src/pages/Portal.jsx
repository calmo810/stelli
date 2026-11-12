import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { Btn, Chip, IconBtn, Loading, Page, Sheet } from '@/components/system';
import { applyPendingSignup } from '@/lib/pendingSignup';
import { loginUrl } from '@/lib/requireSignIn';
import { queryClientInstance } from '@/lib/query-client';
import { CURRENT_USER_KEY, fetchCurrentUser } from '@/hooks/useCurrentUser';

const NEXT_STEP_PROMPT_KEY = 'stelli_next_step_prompt';

function dashboardFor(type) {
  return type === 'creator' ? '/lensman-dashboard' : '/client-dashboard';
}

export default function Portal() {
  const navigate = useNavigate();
  const [promptType, setPromptType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      let user = await fetchCurrentUser();
      if (!active) return;

      // Signed out: log in, then come straight back here.
      if (!user) {
        navigate(loginUrl('/portal'), { replace: true });
        return;
      }

      // What a Google signup chose before leaving for Google is applied now.
      user = await applyPendingSignup(user);
      queryClientInstance.setQueryData(CURRENT_USER_KEY, user);
      if (!active) return;

      if (!user?.account_type) {
        navigate(user?.role === 'admin' ? '/admin' : '/onboarding', { replace: true });
        return;
      }

      // Someone who signed up as a client and later applied as a creator has a
      // creator profile: their portal is the creator one.
      let type = user.account_type;
      if (type !== 'creator') {
        const profiles = await base44.entities.Lensman.filter({ user_id: user.id }).catch(() => []);
        if (profiles.length) type = 'creator';
      }
      if (!active) return;

      const nextStep = localStorage.getItem(NEXT_STEP_PROMPT_KEY);
      if (nextStep === type) {
        setPromptType(type);
        setLoading(false);
        return;
      }

      navigate(dashboardFor(type), { replace: true });
    })();
    return () => { active = false; };
  }, [navigate]);

  const closePrompt = () => {
    localStorage.removeItem(NEXT_STEP_PROMPT_KEY);
    navigate(dashboardFor(promptType), { replace: true });
  };

  const startNextStep = () => {
    localStorage.removeItem(NEXT_STEP_PROMPT_KEY);
    navigate(promptType === 'creator' ? '/apply' : '/creators', { replace: true });
  };

  if (loading || !promptType) {
    return (
      <Page width="narrow">
        <Loading label="Opening your portal" className="min-h-[60vh]" />
      </Page>
    );
  }

  const isCreator = promptType === 'creator';

  return (
    <Page width="narrow">
      <Sheet className={`st-aurora ${isCreator ? 'st-aurora--sky' : 'st-aurora--lime'} px-6 py-10 sm:px-10 sm:py-14`}>
        <div className="flex items-start justify-between gap-4">
          <Chip tone="ink">Portal ready</Chip>
          <IconBtn label="Not now, go to my portal" variant="soft" onClick={closePrompt}>
            <X />
          </IconBtn>
        </div>
        <h1 className="st-display mt-6">
          {isCreator ? (
            <>Ready to get <span className="st-serif">listed?</span></>
          ) : (
            <>Ready to book your <span className="st-serif">first creator?</span></>
          )}
        </h1>
        <p className="st-lede mt-5">
          {isCreator
            ? 'Your creator portal is set. Build your page and Stelli will review your work before it goes live.'
            : 'Your client portal is set. Browse vetted creators and send your first request.'}
        </p>
        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
          <Btn variant="ink" size="lg" arrow="end" onClick={startNextStep}>
            {isCreator ? 'Start your application' : 'Find a creator'}
          </Btn>
          <Btn variant="outline" size="lg" onClick={closePrompt}>
            {isCreator ? 'Apply later' : 'Go to my portal'}
          </Btn>
        </div>
      </Sheet>
    </Page>
  );
}
