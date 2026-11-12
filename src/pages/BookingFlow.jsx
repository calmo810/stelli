import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { displayNameOf } from '@/lib/profilePresets';
import { PRIVACY_VERSION, TERMS_VERSION } from '@/lib/legalDocuments';
import { fieldClass, labelClass } from '@/lib/glassField';
import CanvasGlow from '@/components/shared/CanvasGlow';
import Pill from '@/components/shared/Pill';
import StelliCheck from '@/components/shared/StelliCheck';
import GoogleIcon from '@/components/GoogleIcon';

const MAGENTA = 'hsl(var(--neon-magenta))';

function Field({ label, optional, children }) {
  return (
    <label className="block">
      <span className={labelClass}>
        {label}
        {optional && <span className="font-normal text-white/30"> · optional</span>}
      </span>
      {children}
    </label>
  );
}

/** One block of the form: a quiet heading over a glass panel, as in the portal. */
function Panel({ title, children }) {
  return (
    <section>
      {title && <h2 className="mb-2.5 pl-1.5 text-[13px] font-semibold text-white/50">{title}</h2>}
      <div className="glass space-y-4 rounded-3xl p-4 sm:p-5">{children}</div>
    </section>
  );
}

function draftKey(lensmanId, viewerKey) {
  return `stelli_booking_draft_${lensmanId}_${viewerKey}`;
}

function readDraft(lensmanId, viewerKey) {
  try {
    return JSON.parse(localStorage.getItem(draftKey(lensmanId, viewerKey)) || '{}');
  } catch {
    return {};
  }
}

export default function BookingFlow() {
  const { lensmanId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ event_date: '', event_time: '', location: '', event_type: '', event_description: '', budget: '', duration: '' });
  const [account, setAccount] = useState({ first_name: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [stage, setStage] = useState('request');
  const [existingAccount, setExistingAccount] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [draftReady, setDraftReady] = useState(false);
  // New accounts made here confirm 18+ and the Terms, as on the signup page.
  const [adult, setAdult] = useState(false);
  const [legalAgreed, setLegalAgreed] = useState(false);

  const { data: creator } = useQuery({
    queryKey: ['booking-creator', lensmanId],
    queryFn: async () => {
      const list = await base44.entities.Lensman.filter({ id: lensmanId });
      return list[0] || null;
    },
  });

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['booking-user'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    retry: false,
  });

  const viewerKey = user?.id || 'guest';

  useEffect(() => {
    if (userLoading) return;
    const saved = readDraft(lensmanId, viewerKey);
    // A draft typed before signing in with Google is picked up here.
    const adopted = saved.form ? saved : readDraft(lensmanId, 'guest');
    if (adopted.form) setForm((prev) => ({ ...prev, ...adopted.form }));
    if (user?.full_name && !account.first_name) {
      setAccount((prev) => ({ ...prev, first_name: prev.first_name || user.full_name }));
    }
    setDraftReady(true);
  }, [userLoading, viewerKey, lensmanId, user?.full_name]);

  useEffect(() => {
    if (!draftReady) return;
    localStorage.setItem(draftKey(lensmanId, viewerKey), JSON.stringify({ form }));
  }, [form, lensmanId, viewerKey, draftReady]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateAccount = (key, value) => setAccount((prev) => ({ ...prev, [key]: value }));

  const fileRequest = async () => {
    const response = await base44.functions.invoke('submitBookingRequest', {
      lensmanId,
      eventDate: form.event_date,
      eventTime: form.event_time,
      location: form.location,
      eventType: form.event_type,
      brief: form.event_description,
      budget: form.budget,
      duration: form.duration,
      clientName: account.first_name || user?.full_name || '',
      ageConfirmed: adult || Boolean(user?.age_confirmed),
    });
    if (response.data?.needsAge) {
      throw new Error(response.data.error || "Confirm you're 18 or older to send this.");
    }
    return response.data?.booking;
  };

  // A brand-new account from this form is a client account with the Terms on record.
  const setUpNewAccount = async () => {
    try {
      await base44.auth.updateMe({ account_type: 'client', age_confirmed: true });
      await Promise.all([
        base44.functions.invoke('recordAgreementAcceptance', { documentType: 'terms', documentVersion: TERMS_VERSION }),
        base44.functions.invoke('recordAgreementAcceptance', { documentType: 'privacy', documentVersion: PRIVACY_VERSION }),
      ]);
    } catch {
      // The legal banner asks again on the next page if this did not land.
    }
  };

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      if (!user) {
        if (stage === 'request') {
          if (!account.first_name.trim() || !account.email.trim() || !account.password) {
            setError('Your first name, email and a password are needed.');
            return;
          }
          if (!existingAccount && (!adult || !legalAgreed)) {
            setError("Confirm you're 18 or older and agree to the Terms to create your account.");
            return;
          }
          if (existingAccount) {
            await base44.auth.loginViaEmailPassword(account.email.trim(), account.password);
            const booking = await fileRequest();
            localStorage.removeItem(draftKey(lensmanId, viewerKey));
            navigate(`/request-sent/${booking.id}`);
            return;
          }
          try {
            await base44.auth.register({ email: account.email.trim(), password: account.password });
            setStage('otp');
            return;
          } catch (e) {
            setExistingAccount(true);
            setError('You already have an account — log in to send this.');
            return;
          }
        }

        if (stage === 'otp') {
          const result = await base44.auth.verifyOtp({ email: account.email.trim(), otpCode: otp.trim() });
          base44.auth.setToken(result.access_token);
          await setUpNewAccount();
        }
      }

      const booking = await fileRequest();
      localStorage.removeItem(draftKey(lensmanId, viewerKey));
      navigate(`/request-sent/${booking.id}`);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'We could not send your request. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const continueWithGoogle = () => {
    if (!adult || !legalAgreed) {
      setError("Confirm you're 18 or older and agree to the Terms first.");
      return;
    }
    localStorage.setItem(draftKey(lensmanId, 'guest'), JSON.stringify({ form }));
    localStorage.setItem('stelli_pending_age_confirmed', 'true');
    localStorage.setItem('stelli_pending_legal_acceptance', 'true');
    base44.auth.loginWithProvider('google', `/book/${lensmanId}`);
  };

  if (!creator) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-ink">
        <CanvasGlow />
        <div className="relative mx-auto max-w-[1180px] px-4 pb-24 pt-6 sm:px-5 md:px-10 md:pt-10">
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
            <div className="glass h-[220px] animate-pulse rounded-[28px] lg:h-[520px]" />
            <div className="space-y-4">
              <div className="glass h-14 w-2/3 animate-pulse rounded-2xl" />
              <div className="glass h-[300px] animate-pulse rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const firstName = displayNameOf(creator).split(' ')[0];
  const heroImage = creator.portfolio_images?.[0] || creator.profile_image;
  const canSend = form.event_date && form.event_description.trim() && (user || stage === 'otp' || account.first_name);
  const specialties = (creator.specialties?.length ? creator.specialties : ['Photography']).slice(0, 3);

  return (
    <div className="min-h-screen bg-ink">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 pt-28 pb-24">
        <div className="grid lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-16 items-start">
          <aside className="lg:sticky lg:top-24">
            <Link to={`/creators/${creator.id}`} className="inline-flex items-center gap-2 label-mono text-[10px] text-white/35 hover:text-neon-lime transition-colors mb-6 lg:mb-8">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to profile
            </Link>

            {heroImage && (
              <div className="overflow-hidden h-[190px] lg:h-[520px] mb-6" style={{ borderRadius: 4 }}>
                <img src={heroImage} alt={displayNameOf(creator)} className="w-full h-full object-cover" />
              </div>
            )}

            <h1 className="font-heading font-semibold text-white leading-[0.95] mb-4" style={{ fontSize: 'clamp(30px, 5vw, 58px)' }}>
              {displayNameOf(creator)}
            </h1>
            <p className="label-mono text-[10px]" style={{ color: 'hsl(var(--neon-cyan))' }}>
              {creator.market || 'ELON'} · {creator.specialties?.join(' / ') || 'Photography'}
            </p>
          </aside>

          <div>
            <h2 className="font-heading font-semibold text-white leading-[0.95] mb-5" style={{ fontSize: 'clamp(36px, 5vw, 64px)' }}>
              Book {firstName}.
            </h2>
            <p className="font-body text-[15px] leading-relaxed text-white/55 mb-10 max-w-md">
              Send a date. Work out the details together. Nothing is charged until you accept a quote.
            </p>

            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Date">
                  <input type="date" value={form.event_date} onChange={(e) => update('event_date', e.target.value)} className={fieldClass} />
                </Field>
                <Field label="Start time" optional>
                  <input type="time" value={form.event_time} onChange={(e) => update('event_time', e.target.value)} className={fieldClass} />
                </Field>
              </div>

              <Field label="What are you planning?">
                <textarea
                  rows={3}
                  placeholder="Birthday dinner, 20 people, want a few portraits too"
                  value={form.event_description}
                  onChange={(e) => update('event_description', e.target.value)}
                  className={fieldClass}
                />
              </Field>

              <Field label="Where" optional>
                <input type="text" placeholder="Neighborhood or address" value={form.location} onChange={(e) => update('location', e.target.value)} className={fieldClass} />
              </Field>

              <Field label="Shoot type" optional>
                <input type="text" placeholder="Portraits, senior photos, brand content" value={form.event_type} onChange={(e) => update('event_type', e.target.value)} className={fieldClass} />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="What you expect to spend" optional>
                  <input type="text" placeholder="$200–300" value={form.budget} onChange={(e) => update('budget', e.target.value)} className={fieldClass} />
                </Field>
                <Field label="How long" optional>
                  <input type="text" placeholder="2 hours" value={form.duration} onChange={(e) => update('duration', e.target.value)} className={fieldClass} />
                </Field>
              </div>

              {!user && stage === 'request' && (
                <div className="pt-4 border-t border-white/10 space-y-5">
                  <p className="label-mono text-[10px] text-white/40">Your account</p>
                  <Field label="First name">
                    <input type="text" value={account.first_name} onChange={(e) => updateAccount('first_name', e.target.value)} className={fieldClass} />
                  </Field>
                  <Field label="Email">
                    <input type="email" value={account.email} onChange={(e) => updateAccount('email', e.target.value)} className={fieldClass} />
                  </Field>
                  <Field label={existingAccount ? 'Password' : 'Create a password'}>
                    <input type="password" value={account.password} onChange={(e) => updateAccount('password', e.target.value)} className={fieldClass} />
                  </Field>
                  {!existingAccount && (
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-1 h-4 w-4 accent-[#C4F82A]" />
                        <span className="font-body text-[13px] text-white/60">I'm 18 or older.</span>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" checked={legalAgreed} onChange={(e) => setLegalAgreed(e.target.checked)} className="mt-1 h-4 w-4 accent-[#C4F82A]" />
                        <span className="font-body text-[13px] text-white/60">
                          I agree to Stelli's <Link to="/terms" className="underline underline-offset-2 hover:text-white">Terms</Link>.
                        </span>
                      </label>
                    </div>
                  )}
                  <button onClick={continueWithGoogle} className="w-full py-3.5 label-mono text-[10px] border border-white/15 text-white/60 hover:text-white transition-colors" style={{ borderRadius: 4 }}>
                    Continue with Google
                  </button>
                </div>
              )}

              {user && !user.age_confirmed && (
                <label className="flex items-start gap-3 cursor-pointer pt-2">
                  <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-1 h-4 w-4 accent-[#C4F82A]" />
                  <span className="font-body text-[13px] text-white/60">I'm 18 or older.</span>
                </label>
              )}

              {!user && stage === 'otp' && (
                <div className="pt-4 border-t border-white/10 space-y-5">
                  <p className="font-body text-[13px] text-white/55">
                    We sent a six-digit code to {account.email}.
                  </p>
                  <Field label="Code">
                    <input type="text" inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value)} className={fieldClass} />
                  </Field>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 z-10 mt-9 pt-5 pb-3 bg-ink/95 backdrop-blur">
              <button
                onClick={submit}
                disabled={!canSend || busy}
                className="w-full flex items-center justify-center gap-2.5 label-mono text-[11px] font-semibold px-8 py-4 transition-transform duration-300 hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
                style={{ background: LIME, color: INK, borderRadius: 4 }}
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {stage === 'otp' ? 'Verify and send' : 'Send request'}
              </button>
              <p className="label-mono text-[10px] text-white/35 mt-3">Details can come later in messages.</p>
            </div>

            {error && (
              <p className="font-body text-[13px] mt-5" style={{ color: LIME }}>{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}