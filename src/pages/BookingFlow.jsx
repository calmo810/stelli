import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, Loader2, X, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FORMATS = [
  { type: 'half_day', name: 'The Candid', tagline: 'A short, fast shoot. Built to be an easy yes.' },
  { type: 'full_day', name: 'The Event Film', tagline: 'Full event coverage, stills and motion, start to finish.' },
  { type: 'custom', name: 'The Content Day', tagline: 'A full day, built for volume. A month of content in one afternoon.' },
];

const EVENT_TYPES = [
  { value: 'birthday', label: 'Birthday' },
  { value: 'dinner', label: 'Dinner Party' },
  { value: 'rooftop', label: 'Rooftop Hang' },
  { value: 'music_video', label: 'Music Video' },
  { value: 'restaurant_launch', label: 'Restaurant Launch' },
  { value: 'content_day', label: 'Content Day' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'custom', label: 'Something else' },
];

const STEPS = ['What', 'When & Where', 'Who'];

export default function BookingFlow() {
  const { lensmanId } = useParams();
  const [step, setStep] = useState(1);
  const [sent, setSent] = useState(false);
  const [friendInput, setFriendInput] = useState('');
  const [form, setForm] = useState({
    package_type: 'half_day',
    event_type: '',
    event_date: '',
    event_time: '',
    location: '',
    event_description: '',
    co_bookers: [],
  });

  const { data: lensman } = useQuery({
    queryKey: ['lensman', lensmanId],
    queryFn: async () => {
      const list = await base44.entities.Lensman.filter({ id: lensmanId });
      return list[0];
    },
  });

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const addFriend = () => {
    const email = friendInput.trim();
    if (!email || form.co_bookers.includes(email)) return;
    setForm(prev => ({ ...prev, co_bookers: [...prev.co_bookers, email] }));
    setFriendInput('');
  };

  const sendRequest = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('submitBookingRequest', {
        lensmanId,
        packageType: form.package_type,
        eventType: form.event_type,
        eventDate: form.event_date,
        eventTime: form.event_time,
        location: form.location,
        brief: form.event_description,
        coBookers: form.co_bookers,
      });
      return response.data;
    },
    onSuccess: () => setSent(true),
  });

  const canProceed = () => {
    if (step === 1) return form.package_type && form.event_type;
    if (step === 2) return form.event_date && form.location;
    return true;
  };

  const displayName = lensman?.display_name || lensman?.full_name || '…';

  // — SENT —
  if (sent) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-8 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          className="max-w-md w-full text-center">
          <div className="w-12 h-12 border border-white/10 flex items-center justify-center mx-auto mb-8">
            <Check className="w-5 h-5 text-white" />
          </div>
          <p className="text-[8px] font-body tracking-[0.5em] uppercase mb-5" style={{ color: 'rgba(242,220,169,0.4)' }}>Request sent</p>
          <h1 className="font-display font-semibold text-white leading-[0.9] mb-5" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>
            {displayName} has your brief.
          </h1>
          <p className="font-body text-[13px] leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Nothing has been charged. {displayName} will read your brief and send a private quote for{' '}
            <span className="text-white">{form.event_date && new Date(form.event_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>.
          </p>
          <p className="font-body text-[13px] leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.35)' }}>
            You'll get an email when the quote arrives, and you can accept it from your dashboard.
          </p>

          <div className="flex flex-col gap-3">
            <Link to="/client-dashboard"
              className="w-full py-3.5 text-[11px] font-body tracking-[0.08em] uppercase font-semibold text-center transition-all"
              style={{ background: '#F2DCA9', color: '#0a0a0a', borderRadius: 2 }}>
              Go to your dashboard
            </Link>
            <Link to="/"
              className="w-full py-3.5 text-[11px] font-body tracking-[0.08em] uppercase text-center border border-white/8 transition-all"
              style={{ color: 'rgba(255,255,255,0.3)', borderRadius: 2 }}>
              Back to home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-2xl mx-auto px-8 py-16">

        <Link to={`/creators/${lensmanId}`}
          className="inline-flex items-center gap-2 text-[10px] font-body tracking-[0.1em] uppercase mb-10 transition-colors"
          style={{ color: 'rgba(255,255,255,0.2)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}>
          <ArrowLeft className="w-3 h-3" /> Back to profile
        </Link>

        <div className="mb-10 pb-8 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-[8px] font-body tracking-[0.4em] uppercase mb-2" style={{ color: 'rgba(242,220,169,0.4)' }}>
            Request a shoot with
          </p>
          <h2 className="font-display text-white font-semibold" style={{ fontSize: 'clamp(24px, 4vw, 40px)' }}>
            {displayName}
          </h2>
          <p className="text-[11px] font-body mt-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Send your brief. {displayName} replies with a private quote — no prices up front, nothing charged today.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-10">
          {STEPS.map((label, i) => {
            const s = i + 1;
            const active = step === s;
            const done = step > s;
            return (
              <div key={s} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-6 h-6 flex items-center justify-center text-[9px] font-body font-semibold transition-all"
                    style={{
                      background: done ? '#F2DCA9' : active ? 'rgba(242,220,169,0.15)' : 'transparent',
                      color: done ? '#0a0a0a' : active ? '#F2DCA9' : 'rgba(255,255,255,0.2)',
                      border: active ? '1px solid rgba(242,220,169,0.4)' : done ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    }}>
                    {done ? <Check className="w-3 h-3" /> : s}
                  </div>
                  <span className="text-[7px] font-body tracking-[0.1em] uppercase hidden sm:block"
                    style={{ color: active ? 'rgba(242,220,169,0.6)' : 'rgba(255,255,255,0.15)' }}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px mx-1 transition-all" style={{ background: done ? 'rgba(242,220,169,0.3)' : 'rgba(255,255,255,0.05)' }} />
                )}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>

            {step === 1 && (
              <div>
                <h3 className="font-display text-white font-semibold mb-8" style={{ fontSize: 'clamp(22px, 3.5vw, 34px)' }}>
                  What's the moment?
                </h3>

                <p className="text-[10px] font-body tracking-[0.3em] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.2)' }}>Format</p>
                <div className="space-y-2 mb-8">
                  {FORMATS.map(format => (
                    <button key={format.type} onClick={() => update('package_type', format.type)}
                      className="w-full px-5 py-4 border text-left transition-all"
                      style={{
                        borderColor: form.package_type === format.type ? 'rgba(242,220,169,0.4)' : 'rgba(255,255,255,0.06)',
                        background: form.package_type === format.type ? 'rgba(242,220,169,0.05)' : 'transparent',
                        borderRadius: 2,
                      }}>
                      <p className="font-display text-[16px] font-semibold"
                        style={{ color: form.package_type === format.type ? '#F2DCA9' : 'rgba(255,255,255,0.6)' }}>
                        {format.name}
                      </p>
                      <p className="text-[11px] font-body mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{format.tagline}</p>
                    </button>
                  ))}
                </div>

                <p className="text-[10px] font-body tracking-[0.3em] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.2)' }}>Type of event</p>
                <div className="grid grid-cols-2 gap-2">
                  {EVENT_TYPES.map(t => (
                    <button key={t.value} onClick={() => update('event_type', t.value)}
                      className="px-4 py-3 border text-[12px] font-body text-left transition-all"
                      style={{
                        borderColor: form.event_type === t.value ? 'rgba(242,220,169,0.4)' : 'rgba(255,255,255,0.06)',
                        background: form.event_type === t.value ? 'rgba(242,220,169,0.05)' : 'transparent',
                        color: form.event_type === t.value ? '#F2DCA9' : 'rgba(255,255,255,0.4)',
                        borderRadius: 2,
                      }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h3 className="font-display text-white font-semibold mb-8" style={{ fontSize: 'clamp(22px, 3.5vw, 34px)' }}>
                  When and where?
                </h3>

                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Date *">
                      <input type="date" value={form.event_date} onChange={e => update('event_date', e.target.value)} />
                    </Field>
                    <Field label="Start time">
                      <input type="time" value={form.event_time} onChange={e => update('event_time', e.target.value)} />
                    </Field>
                  </div>
                  <Field label="Location *">
                    <input type="text" placeholder="Address or neighborhood" value={form.location} onChange={e => update('location', e.target.value)} />
                  </Field>
                  <Field label="Your brief">
                    <textarea placeholder="What do you want captured? Any vibe, any shot you can't miss."
                      value={form.event_description} onChange={e => update('event_description', e.target.value)} rows={4} />
                  </Field>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h3 className="font-display text-white font-semibold mb-3" style={{ fontSize: 'clamp(22px, 3.5vw, 34px)' }}>
                  Who's coming?
                </h3>
                <p className="font-body text-[12px] mb-8 leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Optional. Add friends to the request so they can chip in toward the quote and see the photos when they're delivered.
                </p>

                <div className="flex gap-2 mb-3">
                  <input type="email" placeholder="friend@email.com" value={friendInput}
                    onChange={e => setFriendInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addFriend()}
                    className="flex-1 h-10 px-4 text-[12px] font-body bg-transparent border outline-none"
                    style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderRadius: 2 }} />
                  <button onClick={addFriend} className="px-4 h-10 text-[11px] font-body border transition-all"
                    style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', borderRadius: 2 }}>Add</button>
                </div>

                {form.co_bookers.map(email => (
                  <div key={email} className="flex items-center justify-between py-2 px-4 mb-1.5" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                    <span className="text-[12px] font-body" style={{ color: 'rgba(255,255,255,0.4)' }}>{email}</span>
                    <button onClick={() => setForm(prev => ({ ...prev, co_bookers: prev.co_bookers.filter(e => e !== email) }))}>
                      <X className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
                    </button>
                  </div>
                ))}

                <div className="flex items-start gap-4 p-5 mt-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 2 }}>
                  <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'rgba(242,220,169,0.5)' }} />
                  <p className="text-[12px] font-body leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Sending a request is free. You only pay after you accept {displayName}'s quote, and your money stays held until your photos are delivered.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-10 pt-8 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button onClick={() => setStep(s => s - 1)} disabled={step === 1}
            className="flex items-center gap-2 text-[11px] font-body tracking-[0.06em] uppercase transition-all"
            style={{ color: step === 1 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.3)' }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
              className="flex items-center gap-2 text-[11px] font-body tracking-[0.06em] uppercase font-semibold px-7 py-3 transition-all"
              style={{
                background: canProceed() ? '#F2DCA9' : 'rgba(255,255,255,0.06)',
                color: canProceed() ? '#0a0a0a' : 'rgba(255,255,255,0.2)',
                borderRadius: 2,
              }}>
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button onClick={() => sendRequest.mutate()} disabled={sendRequest.isPending}
              className="flex items-center gap-2 text-[11px] font-body tracking-[0.06em] uppercase font-semibold px-7 py-3 transition-all"
              style={{
                background: sendRequest.isPending ? 'rgba(255,255,255,0.06)' : '#F2DCA9',
                color: sendRequest.isPending ? 'rgba(255,255,255,0.2)' : '#0a0a0a',
                borderRadius: 2,
              }}>
              {sendRequest.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Send request
            </button>
          )}
        </div>

        {sendRequest.isError && (
          <p className="text-[12px] font-body mt-4" style={{ color: '#F2DCA9' }}>
            {sendRequest.error?.response?.data?.error || 'We could not send your request. Please make sure you are signed in and try again.'}
          </p>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[10px] font-body tracking-[0.2em] uppercase mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
        {label}
      </label>
      <div className="w-full border overflow-hidden"
        style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
        {React.cloneElement(children, {
          className: 'w-full bg-transparent px-4 py-3 text-[13px] font-body outline-none',
          style: { color: 'rgba(255,255,255,0.8)' },
        })}
      </div>
    </div>
  );
}