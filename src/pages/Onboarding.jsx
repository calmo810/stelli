import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Camera, Search } from 'lucide-react';
import { fetchCurrentUser, refreshCurrentUser } from '@/hooks/useCurrentUser';
import { loginUrl } from '@/lib/requireSignIn';
import AuthLayout from '@/components/AuthLayout';
import { Btn, Check, Field, Note } from '@/components/system';

const ROLES = [
  { id: 'client', kicker: 'Client', title: 'I want to book', body: 'Find a creator, request a shoot, get a private quote.', icon: Search, tint: '!bg-tint-lime' },
  { id: 'creator', kicker: 'Creator', title: 'I shoot', body: 'Get a public profile, quote your work, get paid on delivery.', icon: Camera, tint: '!bg-tint-sky' },
];

const ONBOARDING_DRAFT_KEY = 'stelli_onboarding_draft';

function getOnboardingDraft() {
  try {
    return JSON.parse(localStorage.getItem(ONBOARDING_DRAFT_KEY) || '{}');
  } catch {
    return {};
  }
}

/** The one question a new account has to answer: which side of a booking are you on? */
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
    fetchCurrentUser().then((user) => {
      if (!active) return;
      if (!user) navigate(loginUrl('/onboarding'), { replace: true });
      else if (user.account_type) navigate('/portal', { replace: true });
    });
    return () => { active = false; };
  }, [navigate]);

  useEffect(() => {
    try {
      localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify({ role, form, ageConfirmed }));
    } catch {
      /* the draft is a convenience */
    }
  }, [role, form, ageConfirmed]);

  const missing = !role
    ? 'Pick a side to continue.'
    : form.full_name.trim().length < 2
      ? 'Add your name.'
      : role === 'creator' && !(form.specialty.trim() && form.bio.trim())
        ? 'Add what you shoot and a short bio.'
        : !ageConfirmed
          ? 'Confirm you are 18 or older.'
          : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (missing) {
      setError(missing);
      return;
    }
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
      await refreshCurrentUser();
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
    <AuthLayout title="Which side are you on?" subtitle="Clients and creators get different portals. Pick once.">
      <form onSubmit={handleSubmit} noValidate>
        <div role="radiogroup" aria-label="Account type" className="grid gap-2.5 sm:grid-cols-2">
          {ROLES.map((r) => {
            const active = role === r.id;
            const Icon = r.icon;
            return (
              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setRole(r.id)}
                className={`st-choice ${active ? r.tint : ''}`}
              >
                <span className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-ink text-white" aria-hidden>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="st-kicker block">{r.kicker}</span>
                <span className="mt-1 block text-[20px] font-extrabold tracking-[-0.03em]">{r.title}</span>
                <span className="mt-1.5 block text-[13.5px] leading-snug text-fg-2">{r.body}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <Field label="Full name">
            <input className="st-input" value={form.full_name} autoComplete="name"
              onChange={(e) => update('full_name', e.target.value)} placeholder="Your name" />
          </Field>

          {role === 'creator' && (
            <>
              <Field label="What you shoot">
                <input className="st-input" value={form.specialty}
                  onChange={(e) => update('specialty', e.target.value)} placeholder="Portraits, events, music videos…" />
              </Field>
              <Field label="Instagram handle" optional>
                <input className="st-input" value={form.instagram} autoComplete="off"
                  onChange={(e) => update('instagram', e.target.value)} placeholder="@yourhandle" />
              </Field>
              <Field label="Short bio">
                <textarea className="st-textarea" rows={3} value={form.bio}
                  onChange={(e) => update('bio', e.target.value)} placeholder="Why you shoot." />
              </Field>
            </>
          )}
        </div>

        <Check checked={ageConfirmed} onChange={setAgeConfirmed} className="mt-3">
          I confirm I am 18 or older.
        </Check>

        {error && <Note tone="error" className="mt-2">{error}</Note>}

        <Btn type="submit" loading={saving} arrow="end" block className="mt-5">
          Continue
        </Btn>
      </form>
    </AuthLayout>
  );
}
