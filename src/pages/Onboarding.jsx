import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';
import { useMarket, MARKETS } from '@/lib/market';

const ROLES = [
  { id: 'client', title: 'I want to book', body: 'Find a creator, request a shoot, get a private quote.', accent: 'hsl(var(--neon-lime))' },
  { id: 'creator', title: 'I shoot', body: 'Get a public profile, quote your work, get paid on delivery.', accent: 'hsl(var(--neon-cyan))' },
];

const inputClass = 'w-full bg-surface-2 border border-white/12 px-4 py-3 font-body text-[13px] text-white placeholder:text-white/25 outline-none focus:border-neon-lime transition-colors';
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
  const { market, setMarket } = useMarket();

  const draft = getOnboardingDraft();
  const [role, setRole] = useState(draft.role || '');
  const [form, setForm] = useState(draft.form || { full_name: '', specialty: '', instagram: '', bio: '' });
  const [ageConfirmed, setAgeConfirmed] = useState(Boolean(draft.ageConfirmed));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

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
        market,
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
    <div className="min-h-screen bg-ink">
      <div className="max-w-3xl mx-auto px-5 md:px-10 pt-32 pb-24">
        <p className="label-mono text-[9px] text-white/35 mb-5">One last thing</p>
        <h1 className="font-heading font-semibold text-white leading-[0.95] mb-5" style={{ fontSize: 'clamp(38px, 6vw, 76px)' }}>
          Which side are you on?
        </h1>
        <p className="font-body text-[14px] leading-relaxed text-white/45 max-w-lg mb-12">
          Clients and creators see completely different portals. Pick once — it decides everything after this.
        </p>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid sm:grid-cols-2 gap-4">
            {ROLES.map((r) => {
              const active = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className="text-left p-6 border transition-colors duration-300"
                  style={{
                    borderRadius: 4,
                    borderColor: active ? r.accent : 'rgba(255,255,255,0.12)',
                    background: 'hsl(var(--surface))',
                  }}
                >
                  <p className="label-mono text-[9px] mb-4" style={{ color: active ? r.accent : 'rgba(255,255,255,0.3)' }}>
                    {r.id === 'client' ? 'Client' : 'Creator'}
                  </p>
                  <p className="font-heading text-[24px] font-semibold text-white mb-2">{r.title}</p>
                  <p className="font-body text-[12px] leading-relaxed text-white/45">{r.body}</p>
                </button>
              );
            })}
          </div>

          <div className="space-y-5">
            <div>
              <label className="label-mono text-[9px] text-white/40 block mb-2">Full name</label>
              <input className={inputClass} style={{ borderRadius: 4 }} value={form.full_name}
                onChange={(e) => update('full_name', e.target.value)} placeholder="Your name" />
            </div>

            <div>
              <label className="label-mono text-[9px] text-white/40 block mb-2">Market</label>
              <div className="grid sm:grid-cols-2 gap-3">
                {MARKETS.map((m) => {
                  const active = market === m.id;
                  return (
                    <button key={m.id} type="button" onClick={() => setMarket(m.id)}
                      className="text-left p-4 border transition-colors duration-300"
                      style={{ borderRadius: 4, borderColor: active ? 'hsl(var(--neon-lime))' : 'rgba(255,255,255,0.12)' }}>
                      <p className="font-heading text-[17px] font-semibold text-white">{m.label}</p>
                      <p className="font-body text-[11px] text-white/40 mt-1">{m.blurb}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {role === 'creator' && (
              <>
                <div>
                  <label className="label-mono text-[9px] text-white/40 block mb-2">Specialty</label>
                  <input className={inputClass} style={{ borderRadius: 4 }} value={form.specialty}
                    onChange={(e) => update('specialty', e.target.value)} placeholder="Portraits, events, music videos…" />
                </div>
                <div>
                  <label className="label-mono text-[9px] text-white/40 block mb-2">Instagram handle</label>
                  <input className={inputClass} style={{ borderRadius: 4 }} value={form.instagram}
                    onChange={(e) => update('instagram', e.target.value)} placeholder="@yourhandle" />
                </div>
                <div>
                  <label className="label-mono text-[9px] text-white/40 block mb-2">Short bio</label>
                  <textarea className={inputClass} style={{ borderRadius: 4 }} rows={3} value={form.bio}
                    onChange={(e) => update('bio', e.target.value)} placeholder="Why you shoot." />
                </div>
              </>
            )}
          </div>

          <button type="button" onClick={() => setAgeConfirmed(!ageConfirmed)} className="flex items-start gap-3 text-left">
            <span className="w-4 h-4 border flex items-center justify-center shrink-0 mt-0.5 transition-colors"
              style={{ borderRadius: 3, borderColor: ageConfirmed ? 'hsl(var(--neon-lime))' : 'rgba(255,255,255,0.2)', background: ageConfirmed ? 'hsl(var(--neon-lime))' : 'transparent' }}>
              {ageConfirmed && <Check className="w-3 h-3" strokeWidth={3} style={{ color: 'hsl(var(--ink))' }} />}
            </span>
            <span className="font-body text-[12px] leading-relaxed text-white/50">I confirm I am 18 or older.</span>
          </button>

          {error && <p className="font-body text-[12px]" style={{ color: 'hsl(var(--neon-magenta))' }}>{error}</p>}

          <button
            type="submit"
            disabled={!canSubmit || saving}
            className="inline-flex items-center gap-2 label-mono text-[11px] font-semibold px-8 py-4 transition-transform duration-300"
            style={{
              borderRadius: 4,
              background: canSubmit && !saving ? 'hsl(var(--neon-lime))' : 'rgba(255,255,255,0.08)',
              color: canSubmit && !saving ? 'hsl(var(--ink))' : 'rgba(255,255,255,0.3)',
              cursor: canSubmit && !saving ? 'pointer' : 'not-allowed',
            }}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}