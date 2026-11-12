import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';
import { AuthCanvas } from '@/components/AuthLayout';
import Pill from '@/components/shared/Pill';
import StelliCheck from '@/components/shared/StelliCheck';
import { fieldClass, labelClass } from '@/lib/glassField';

// The same two doors as the home page: lime for clients, cyan for creators.
const ROLES = [
  { id: 'client', title: 'I want to book', body: 'Find a creator, request a shoot, get a private quote.', accent: 'var(--neon-lime)' },
  { id: 'creator', title: 'I shoot', body: 'Get a public profile, quote your work, get paid on delivery.', accent: 'var(--neon-cyan)' },
];
const ONBOARDING_DRAFT_KEY = 'stelli_onboarding_draft';

function getOnboardingDraft() {
  try {
    return JSON.parse(localStorage.getItem(ONBOARDING_DRAFT_KEY) || '{}');
  } catch {
    return {};
  }
}

export default function Onboarding() {
  const navigate = useNavigate();

  const draft = getOnboardingDraft();
  const [role, setRole] = useState(draft.role || '');
  const [form, setForm] = useState(draft.form || { full_name: '', specialty: '', instagram: '', bio: '' });
  const [ageConfirmed, setAgeConfirmed] = useState(Boolean(draft.ageConfirmed));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // Onboarding is for an account that has not picked a side yet. Signed out:
  // log in first. Already set up: this page would overwrite the account type,
  // so it goes to the portal instead.
  useEffect(() => {
    let active = true;
    base44.auth
      .me()
      .then((user) => {
        if (!active) return;
        if (user?.account_type) navigate('/portal', { replace: true });
      })
      .catch(() => {
        if (active) navigate(`/login?returnTo=${encodeURIComponent('/onboarding')}`, { replace: true });
      });
    return () => { active = false; };
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify({ role, form, ageConfirmed }));
  }, [role, form, ageConfirmed]);

  const canSubmit =
    role &&
    form.full_name.trim().length > 1 &&
    ageConfirmed &&
    (role === 'client' || (form.specialty.trim() && form.bio.trim()));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await base44.auth.updateMe({
        account_type: role,
        profile_name: form.full_name.trim(),
        market: 'ELON',
        age_confirmed: true,
        ...(role === 'creator'
          ? { specialty: form.specialty.trim(), instagram: form.instagram.trim(), bio: form.bio.trim() }
          : {}),
      });
      localStorage.removeItem(ONBOARDING_DRAFT_KEY);
      localStorage.setItem('stelli_next_step_prompt', role);
      navigate('/portal', { replace: true });
    } catch (err) {
      setError(err?.message || 'We could not save your details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthCanvas width="max-w-[720px]" back={false}>
      <div className="text-center">
        <h1
          className="font-display font-medium text-white"
          style={{ fontSize: 'clamp(36px, 5.5vw, 56px)', letterSpacing: '-0.025em', lineHeight: 1.02 }}
        >
          Which side are you on?
        </h1>
        <p className="mx-auto mt-3 max-w-[460px] text-[15px] leading-relaxed text-white/55">
          Clients and creators see completely different portals. Pick once\u00a0— it decides everything after this.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8">
        <div className="grid grid-cols-2 gap-2 md:gap-3.5">
          {ROLES.map((r) => {
            const active = role === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                aria-pressed={active}
                className="depth relative flex min-h-[190px] flex-col items-center justify-center overflow-hidden rounded-[18px] px-3 py-6 text-center transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-1 md:min-h-[230px] md:rounded-3xl md:px-6"
                style={{
                  background: [
                    `radial-gradient(80% 60% at 50% 100%, hsl(${r.accent} / ${active ? 0.4 : 0.14}), transparent 70%)`,
                    'linear-gradient(180deg, hsl(var(--surface-2)), hsl(var(--surface)) 60%)',
                  ].join(', '),
                  outline: active ? `2px solid hsl(${r.accent})` : '2px solid transparent',
                  outlineOffset: -2,
                }}
              >
                <span
                  aria-hidden
                  className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full transition-opacity"
                  style={{ background: `hsl(${r.accent})`, opacity: active ? 1 : 0 }}
                >
                  <Check className="h-3.5 w-3.5 text-ink" strokeWidth={3} />
                </span>
                <span
                  className="font-display font-medium text-white"
                  style={{ fontSize: 'clamp(24px, 3.4vw, 38px)', letterSpacing: '-0.03em', lineHeight: 1.05 }}
                >
                  {r.title}
                </span>
                <span className="mt-2.5 max-w-[260px] text-[13px] leading-snug text-white/75 md:text-[15px]">{r.body}</span>
              </button>
            );
          })}
        </div>

        <div className="glass mt-6 space-y-4 rounded-3xl p-4 sm:p-5">
          <label className="block">
            <span className={labelClass}>Full name</span>
            <input className={fieldClass} autoComplete="name" value={form.full_name}
              onChange={(e) => update('full_name', e.target.value)} placeholder="Your name" />
          </label>

          {role === 'creator' && (
            <>
              <label className="block">
                <span className={labelClass}>Specialty</span>
                <input className={fieldClass} value={form.specialty}
                  onChange={(e) => update('specialty', e.target.value)} placeholder="Portraits, events, music videos…" />
              </label>
              <label className="block">
                <span className={labelClass}>Instagram handle</span>
                <input className={fieldClass} value={form.instagram}
                  onChange={(e) => update('instagram', e.target.value)} placeholder="@yourhandle" />
              </label>
              <label className="block">
                <span className={labelClass}>Short bio</span>
                <textarea className={`${fieldClass} resize-none`} rows={3} value={form.bio}
                  onChange={(e) => update('bio', e.target.value)} placeholder="Why you shoot." />
              </label>
            </>
          )}

          <StelliCheck checked={ageConfirmed} onChange={setAgeConfirmed} className="pt-1">
            I confirm I am 18 or older.
          </StelliCheck>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-[14px] leading-snug" style={{ color: 'hsl(var(--neon-magenta))' }}>
            {error}
          </p>
        )}

        <Pill
          as="button"
          type="submit"
          tone={role === 'creator' ? 'cyan' : 'lime'}
          disabled={!canSubmit || saving}
          className="mt-6 h-[52px] w-full"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Continue
        </Pill>
      </form>
    </AuthCanvas>
  );
}
