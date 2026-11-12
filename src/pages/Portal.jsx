import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Loader2, X } from 'lucide-react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import Pill from '@/components/shared/Pill';

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

      try {
        // What a Google signup chose before leaving for Google is applied now.
        const pendingRole = localStorage.getItem('stelli_pending_account_type');
        const pendingAdult = localStorage.getItem('stelli_pending_age_confirmed') === 'true';
        const changes = {};
        if (!user.account_type && ['client', 'creator'].includes(pendingRole)) changes.account_type = pendingRole;
        if (pendingAdult && !user.age_confirmed) changes.age_confirmed = true;
        if (Object.keys(changes).length) user = await base44.auth.updateMe(changes);
        localStorage.removeItem('stelli_pending_account_type');
        localStorage.removeItem('stelli_pending_age_confirmed');
      } catch {
        // Not fatal: onboarding asks again below if the type is still missing.
      }
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
      <div className="flex min-h-[70vh] items-center justify-center bg-ink">
        <Loader2 className="h-6 w-6 animate-spin text-neon-lime" />
      </div>
    );
  }

  const isCreator = promptType === 'creator';
  // Clients are lime, creators are cyan — the same two doors as the home page.
  const accent = isCreator ? 'var(--neon-cyan)' : 'var(--neon-lime)';

  return (
    <DashboardShell>
      <div
        className="glass depth relative overflow-hidden rounded-[28px] px-6 pb-7 pt-14 sm:px-9 sm:pb-9"
        style={{ background: `radial-gradient(90% 70% at 50% 110%, hsl(${accent} / 0.22), transparent 70%), rgba(255,255,255,0.08)` }}
      >
        <button
          type="button"
          onClick={closePrompt}
          aria-label={isCreator ? 'Apply later' : 'Browse first'}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/[0.08] text-white/60 transition-colors hover:bg-white/[0.14] hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <h1
          className="font-display font-medium text-white"
          style={{ fontSize: 'clamp(34px, 5vw, 46px)', letterSpacing: '-0.02em', lineHeight: 1.05 }}
        >
          {isCreator ? 'Ready to get listed?' : 'Ready to book your first creator?'}
        </h1>
        <p className="mt-3 max-w-[440px] text-[15px] leading-relaxed text-white/65">
          {isCreator
            ? 'Your creator portal is set. Start your application and Stelli will review your work and build your public profile.'
            : 'Your client portal is set. Browse vetted creators and send your first request.'}
        </p>

        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
          <Pill as="button" type="button" tone={isCreator ? 'cyan' : 'lime'} onClick={startNextStep} className="h-[52px] sm:flex-1">
            {isCreator ? 'Start your application' : 'Find a creator'}
          </Pill>
          <Pill as="button" type="button" tone="glass" onClick={closePrompt} className="h-[52px] sm:flex-1">
            {isCreator ? 'Apply later' : 'Browse first'}
          </Pill>
        </div>
      </div>
    </DashboardShell>
  );
}
