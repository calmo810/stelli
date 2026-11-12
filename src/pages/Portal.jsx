import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, X } from 'lucide-react';
import { applyPendingSignupChoices } from '@/lib/signupChoices';

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
      let user = null;
      try {
        user = await base44.auth.me();
      } catch {
        user = null;
      }
      if (!active) return;

      // Signed out: log in, then come straight back here.
      if (!user) {
        navigate(`/login?returnTo=${encodeURIComponent('/portal')}`, { replace: true });
        return;
      }

      // What a Google signup chose before leaving for Google is applied now.
      // Not fatal if it fails: onboarding asks again below if the type is
      // still missing.
      user = await applyPendingSignupChoices(user);
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
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'hsl(var(--neon-lime))' }} />
      </div>
    );
  }

  const isCreator = promptType === 'creator';

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-5 py-24">
      <div className="w-full max-w-2xl border border-white/10 bg-surface p-6 md:p-10" style={{ borderRadius: 4 }}>
        <button onClick={closePrompt} className="ml-auto flex text-white/35 hover:text-white transition-colors" aria-label="Apply later">
          <X className="w-5 h-5" />
        </button>
        <p className="label-mono text-[10px] text-neon-lime mb-5">Portal ready</p>
        <h1 className="font-heading font-semibold text-white leading-[0.95] mb-5" style={{ fontSize: 'clamp(38px, 6vw, 76px)' }}>
          {isCreator ? 'Ready to get listed?' : 'Ready to book your first creator?'}
        </h1>
        <p className="font-body text-[14px] leading-relaxed text-white/55 max-w-lg mb-9">
          {isCreator
            ? 'Your creator portal is set. Start your application and Stelli will review your work and build your public profile.'
            : 'Your client portal is set. Browse vetted creators and send your first request.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={startNextStep}
            className="inline-flex items-center justify-center gap-2 label-mono text-[11px] font-semibold px-8 py-4 transition-transform duration-300 hover:-translate-y-0.5"
            style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}
          >
            {isCreator ? 'Start your application' : 'Find a creator'}
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={closePrompt}
            className="label-mono text-[11px] px-8 py-4 border border-white/15 text-white/50 hover:text-white hover:border-white/40 transition-colors"
            style={{ borderRadius: 4 }}
          >
            {isCreator ? 'Apply later' : 'Browse first'}
          </button>
        </div>
      </div>
    </div>
  );
}