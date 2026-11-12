import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44, errorMessage } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { CalendarX } from 'lucide-react';
import { displayNameOf, profilePath } from '@/lib/creatorProfile';
import GoogleIcon from '@/components/GoogleIcon';
import { Avatar, Btn, Card, Check, Chip, EmptyState, Field, Note, Page, Sheet, Skeleton } from '@/components/system';
import useCurrentUser, { refreshCurrentUser } from '@/hooks/useCurrentUser';
import { rememberSignupChoices } from '@/lib/pendingSignup';
import { PRIVACY_VERSION, TERMS_VERSION } from '@/lib/legalDocuments';

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

  const [form, setForm] = useState({ event_date: '', event_time: '', location: '', shoot_setting: 'flexible', weather_alerts_enabled: false, event_type: '', event_description: '', budget: '', duration: '' });
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

  const { data: creator, isLoading: creatorLoading } = useQuery({
    queryKey: ['booking-creator', lensmanId],
    queryFn: async () => {
      const list = await base44.entities.Lensman.filter({ id: lensmanId });
      return list[0] || null;
    },
  });

  const { user, isLoading: userLoading } = useCurrentUser();

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
      shootSetting: form.shoot_setting,
      weatherAlertsEnabled: form.weather_alerts_enabled,
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
            await refreshCurrentUser();
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
            // Most often the email is already registered: offer the log-in path,
            // and say what the server said in case it was something else.
            setExistingAccount(true);
            setError(`We couldn't create that account${e?.message && !/status code/i.test(e.message) ? ` (${e.message})` : ''}. If you already have one, enter its password to log in and send this.`);
            return;
          }
        }

        if (stage === 'otp') {
          const result = await base44.auth.verifyOtp({ email: account.email.trim(), otpCode: otp.trim() });
          base44.auth.setToken(result.access_token);
          await setUpNewAccount();
          await refreshCurrentUser();
        }
      }

      const booking = await fileRequest();
      localStorage.removeItem(draftKey(lensmanId, viewerKey));
      navigate(`/request-sent/${booking.id}`);
    } catch (e) {
      setError(errorMessage(e, 'We could not send your request. Please try again.'));
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
    // Someone signing up from a booking form is a client: said here, so they
    // come back to this request instead of being asked which side they are on.
    rememberSignupChoices({ accountType: 'client', adult: true, legal: true });
    base44.auth.loginWithProvider('google', `/book/${lensmanId}`);
  };

  // A creator who is gone, on hold or not approved yet can't be booked: say so,
  // rather than leaving an empty frame on screen forever.
  if (!creator && !creatorLoading) {
    return (
      <Page width="narrow">
        <Sheet>
          <EmptyState
            icon={CalendarX}
            title="This creator isn't taking requests."
            body="Their page may be paused, or the link is out of date."
            action={<Btn to="/creators" arrow="end">Browse all creators</Btn>}
          />
        </Sheet>
      </Page>
    );
  }

  if (!creator) {
    return (
      <Page width="wide">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]" aria-busy="true" aria-label="Loading">
          <Skeleton className="h-[260px] !rounded-st-lg lg:h-[560px]" />
          <Skeleton className="h-[560px] !rounded-st-lg" />
        </div>
      </Page>
    );
  }

  const name = displayNameOf(creator);
  const firstName = name.split(' ')[0];
  const heroImage = creator.portfolio_images?.[0] || creator.profile_image;
  const canSend = form.event_date && form.event_description.trim() && (user || stage === 'otp' || account.first_name);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Page width="wide">
      <div className="grid items-start gap-3 lg:grid-cols-[0.85fr_1.15fr] lg:gap-5">
        {/* Who you are booking: the cover, the face, and how it works. */}
        <aside className="st-card st-card--lg st-paper overflow-hidden lg:sticky lg:top-24">
          <div className="st-aurora st-aurora--lime relative h-[150px] sm:h-[200px] lg:h-[300px]">
            {heroImage && <img src={heroImage} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="relative px-5 pb-6 sm:px-7">
            <div className="-mt-10 flex items-end justify-between gap-3">
              <Avatar src={creator.profile_image} name={name} size="xl" ring className="!h-20 !w-20" />
              <Btn to={profilePath(creator)} variant="outline" size="sm">
                View profile
              </Btn>
            </div>
            <p className="st-kicker mt-4">You are booking</p>
            <p className="st-h2 mt-1">{name}</p>
            {creator.specialties?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {creator.specialties.slice(0, 4).map((item) => (
                  <Chip key={item}>{item}</Chip>
                ))}
              </div>
            )}
            <ol className="mt-5 hidden space-y-3 border-t border-line pt-5 lg:block">
              {[
                ['Send your date and idea.', 'No obligation.'],
                [`${firstName} sends a private quote`, 'in your messages.'],
                ['Accept and pay.', 'Held until your photos arrive.'],
              ].map(([lead, rest], i) => (
                <li key={lead} className="flex gap-3 text-[14px] leading-snug text-fg-2">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-[11px] font-bold text-white">{i + 1}</span>
                  <span>
                    <b className="font-semibold text-fg">{lead}</b> {rest}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <Sheet as="section" aria-labelledby="book-title">
          <h1 id="book-title" className="st-h1">
            Book <span className="st-serif">{firstName}.</span>
          </h1>
          <p className="st-lede mt-3">
            Send a date and work out the details together. Nothing is charged until you accept a quote.
          </p>

          <div className="mt-7">
            <div className="grid gap-x-4 sm:grid-cols-2">
              <Field label="Date">
                <input type="date" min={today} value={form.event_date} onChange={(e) => update('event_date', e.target.value)} className="st-input" />
              </Field>
              <Field label="Start time" optional className="!mt-4 sm:!mt-0">
                <input type="time" value={form.event_time} onChange={(e) => update('event_time', e.target.value)} className="st-input" />
              </Field>
            </div>

            <Field label="What are you planning?">
              <textarea
                rows={3}
                placeholder="Birthday dinner, 20 people, want a few portraits too"
                value={form.event_description}
                onChange={(e) => update('event_description', e.target.value)}
                className="st-textarea"
              />
            </Field>

            <Field label="Location" optional hint="A street address lets us check the weather for an outdoor shoot.">
              <input type="text" placeholder="Fonville Fountain, or an address" value={form.location} onChange={(e) => update('location', e.target.value)} className="st-input" />
            </Field>

            <div className="st-field">
              <p className="st-label" id="setting-label">
                <span>Shoot setting<small> · optional</small></span>
              </p>
              <div className="st-seg st-seg--block" role="group" aria-labelledby="setting-label">
                {[
                  { value: 'outdoor', label: 'Outdoors' },
                  { value: 'indoor', label: 'Indoors' },
                  { value: 'flexible', label: 'Not sure' },
                ].map(({ value, label }) => (
                  <button key={value} type="button" onClick={() => update('shoot_setting', value)} aria-pressed={form.shoot_setting === value}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {form.shoot_setting === 'outdoor' && (
              <Check checked={form.weather_alerts_enabled} onChange={(value) => update('weather_alerts_enabled', value)} className="mt-2">
                <b className="block font-semibold text-fg">Email weather updates to both of us</b>
                Rain and wind conditions before the shoot.
              </Check>
            )}

            <Field label="Shoot type" optional>
              <input type="text" placeholder="Portraits, senior photos, brand content" value={form.event_type} onChange={(e) => update('event_type', e.target.value)} className="st-input" />
            </Field>

            <div className="mt-4 grid gap-x-4 sm:grid-cols-2">
              <Field label="What you expect to spend" optional>
                <input type="text" placeholder="$200–300" value={form.budget} onChange={(e) => update('budget', e.target.value)} className="st-input" />
              </Field>
              <Field label="How long" optional className="!mt-4 sm:!mt-0">
                <input type="text" placeholder="2 hours" value={form.duration} onChange={(e) => update('duration', e.target.value)} className="st-input" />
              </Field>
            </div>

            {!user && stage === 'request' && (
              <Card tone="soft" className="mt-6">
                <h2 className="st-h3">{existingAccount ? 'Log in to send this' : 'Your account'}</h2>
                <p className="st-small mt-1">
                  {existingAccount ? 'Use the password for this email.' : 'So the creator can reply to you. It takes a minute.'}
                </p>
                <div className="mt-4">
                  <Field label="First name">
                    <input type="text" autoComplete="given-name" value={account.first_name} onChange={(e) => updateAccount('first_name', e.target.value)} className="st-input !bg-white" />
                  </Field>
                  <Field label="Email">
                    <input type="email" autoComplete="email" value={account.email} onChange={(e) => updateAccount('email', e.target.value)} className="st-input !bg-white" />
                  </Field>
                  <Field label={existingAccount ? 'Password' : 'Create a password'}>
                    <input type="password" autoComplete={existingAccount ? 'current-password' : 'new-password'} value={account.password} onChange={(e) => updateAccount('password', e.target.value)} className="st-input !bg-white" />
                  </Field>
                </div>
                <button type="button" className="st-link mt-3 inline-flex min-h-[36px] items-center text-[13.5px]" onClick={() => { setExistingAccount(!existingAccount); setError(''); }}>
                  {existingAccount ? 'New here? Create an account instead' : 'Already have an account? Log in instead'}
                </button>
                {!existingAccount && (
                  <div className="mt-1">
                    <Check checked={adult} onChange={setAdult}>I'm 18 or older.</Check>
                    <Check checked={legalAgreed} onChange={setLegalAgreed}>
                      I agree to Stelli's{' '}
                      <Link to="/terms" target="_blank" className="st-link" onClick={(e) => e.stopPropagation()}>
                        Terms
                      </Link>
                      .
                    </Check>
                    <Btn variant="outline" block className="mt-2" onClick={continueWithGoogle}>
                      <GoogleIcon className="h-5 w-5" /> Continue with Google
                    </Btn>
                  </div>
                )}
              </Card>
            )}

            {user && !user.age_confirmed && (
              <Check checked={adult} onChange={setAdult} className="mt-3">I'm 18 or older.</Check>
            )}

            {!user && stage === 'otp' && (
              <Card tone="sky" className="mt-6">
                <h2 className="st-h3">Check your email</h2>
                <p className="st-small mt-1">We sent a six-digit code to {account.email}.</p>
                <Field label="Code" className="mt-4">
                  <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className="st-input !bg-white tracking-[0.3em]" />
                </Field>
              </Card>
            )}
          </div>

          {error && <Note tone="error" className="mt-5">{error}</Note>}

          <div className="sticky z-10 -mx-4 mt-6 bg-gradient-to-t from-[#edf3fa] via-[#edf3fa] to-transparent px-4 pb-1 pt-5 sm:-mx-7 sm:px-7 lg:-mx-10 lg:px-10" style={{ bottom: 'var(--tabbar-h)' }}>
            <Btn size="lg" block arrow="end" onClick={submit} disabled={!canSend} loading={busy}>
              {stage === 'otp' ? 'Verify and send' : 'Send request'}
            </Btn>
            <p className="st-small mt-2.5 text-center">
              {canSend ? 'Details can come later in messages.' : 'Add a date and what you are planning to send this.'}
            </p>
          </div>
        </Sheet>
      </div>
    </Page>
  );
}
