import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, X } from 'lucide-react';

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
      try {
        let user = await base44.auth.me();
        const pendingRole = localStorage.getItem('stelli_pending_account_type');
        if (!user?.account_type && ['client', 'creator'].includes(pendingRole)) {
          user = await base44.auth.updateMe({ account_type: pendingRole });
          localStorage.removeItem('stelli_pending_account_type');
        }
        if (!active) return;

        if (!user?.account_type) {
          navigate('/onboarding', { replace: true });
          return;
        }

        const nextStep = localStorage.getItem(NEXT_STEP_PROMPT_KEY);
        if (nextStep === user.account_type) {
          setPromptType(user.account_type);
          setLoading(false);
          return;
        }

        navigate(dashboardFor(user.account_type), { replace: true });
      } catch {
        if (active) navigate('/onboarding', { replace: true });
      }
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
          {isCreator ? 'Ready to get listed?' : 'Ready to book your first curator?'}
        </h1>
        <p className="font-body text-[14px] leading-relaxed text-white/55 max-w-lg mb-9">
          {isCreator
            ? 'Your curator portal is set. The easiest next step is to start your application so Stelli can review your work and build your public profile.'
            : 'Your client portal is set. The easiest next step is to browse vetted curators and send your first shoot request.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={startNextStep}
            className="inline-flex items-center justify-center gap-2 label-mono text-[11px] font-semibold px-8 py-4 transition-transform duration-300 hover:-translate-y-0.5"
            style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}
          >
            {isCreator ? 'Start your application' : 'Book a curator'}
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