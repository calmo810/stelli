import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, Shield, Loader2, Users, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const ADDONS = [
  { id: 'rush', label: '48-hour rush delivery', price: 150 },
  { id: 'raw', label: 'Raw files included', price: 100 },
  { id: 'bts', label: 'Behind-the-scenes video', price: 200 },
];

const PRODUCTS = [
  {
    type: 'half_day',
    name: 'The Candid',
    tagline: '4-hour shoot · edited photos · digital delivery',
    rateKey: 'rate_half_day',
    defaultPrice: 800,
  },
  {
    type: 'full_day',
    name: 'The Event Film',
    tagline: 'Full day · photo + video package',
    rateKey: 'rate_full_day',
    defaultPrice: 1400,
  },
  {
    type: 'custom',
    name: 'The Content Day',
    tagline: 'A month of content in one afternoon',
    rateKey: 'rate_custom',
    defaultPrice: 1000,
  },
];

// Mask name: "Wyatt Trundle" → "Wyatt T." until booking confirmed
function maskName(fullName) {
  if (!fullName) return '';
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export default function BookingFlow() {
  const { lensmanId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    event_date: '', event_time: '', event_type: '', location: '',
    event_description: '', attendees: '',
    package_type: 'half_day', add_ons: [],
    client_name: '', client_email: '', client_phone: '',
    co_bookers: [],
  });
  const [coBookerInput, setCoBookerInput] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  const { data: lensman } = useQuery({
    queryKey: ['lensman', lensmanId],
    queryFn: async () => {
      const list = await base44.entities.Lensman.filter({ id: lensmanId });
      return list[0];
    },
  });

  const createBooking = useMutation({
    mutationFn: (data) => base44.entities.Booking.create(data),
    onSuccess: (booking) => {
      setBookingResult(booking);
      setStep(5);
    },
  });

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const toggleAddon = (id) => {
    setForm(prev => ({
      ...prev,
      add_ons: prev.add_ons.includes(id)
        ? prev.add_ons.filter(a => a !== id)
        : [...prev.add_ons, id],
    }));
  };

  const getProductPrice = () => {
    if (!lensman) return 800;
    const product = PRODUCTS.find(p => p.type === form.package_type);
    return lensman[product?.rateKey] || product?.defaultPrice || 800;
  };

  const getAddonsPrice = () =>
    form.add_ons.reduce((sum, id) => sum + (ADDONS.find(a => a.id === id)?.price || 0), 0);

  const totalPrice = getProductPrice() + getAddonsPrice();

  const handleSubmit = () => {
    const deliveryDate = new Date(form.event_date);
    deliveryDate.setDate(deliveryDate.getDate() + (form.add_ons.includes('rush') ? 5 : 14));

    createBooking.mutate({
      lensman_id: lensmanId,
      lensman_name: lensman?.full_name,
      client_name: form.client_name,
      client_email: form.client_email,
      client_phone: form.client_phone,
      event_date: form.event_date,
      event_time: form.event_time,
      event_type: form.event_type,
      event_description: form.event_description,
      location: form.location,
      attendees: form.attendees ? parseInt(form.attendees) : null,
      package_type: form.package_type,
      add_ons: form.add_ons,
      total_price: totalPrice,
      status: 'confirmed',
      payment_status: 'held',
      delivery_deadline: deliveryDate.toISOString().split('T')[0],
    });
  };

  const addCoBooker = () => {
    if (!coBookerInput.trim() || form.co_bookers.includes(coBookerInput.trim())) return;
    setForm(prev => ({ ...prev, co_bookers: [...prev.co_bookers, coBookerInput.trim()] }));
    setCoBookerInput('');
  };

  const canProceed = () => {
    if (step === 1) return form.event_type && form.package_type;
    if (step === 2) return form.event_date && form.location;
    if (step === 3) return form.client_name && form.client_email;
    if (step === 4) return agreed;
    return true;
  };

  const maskedName = lensman ? maskName(lensman.full_name) : '…';
  const displayName = lensman?.display_name || maskedName;

  const STEPS = ['What', 'When & Where', 'Your info', 'Confirm'];

  // — CONFIRMATION —
  if (step === 5) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-8 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          className="max-w-md w-full text-center">
          <div className="w-12 h-12 border border-white/10 flex items-center justify-center mx-auto mb-8">
            <Check className="w-5 h-5 text-white" />
          </div>
          <p className="text-[8px] font-body tracking-[0.5em] uppercase mb-5" style={{ color: 'rgba(242,220,169,0.4)' }}>Booking confirmed</p>
          <h1 className="font-display font-semibold text-white leading-[0.9] mb-5" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>
            It's yours.<br />Now go be the star.
          </h1>
          <p className="font-body text-[13px] leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Your shoot is booked for{' '}
            <span className="text-white">{form.event_date && new Date(form.event_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>.
          </p>
          <p className="font-body text-[13px] leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Your creator's full name and a direct message thread will unlock now. Your payment is held safe — nothing leaves until your photos do.
          </p>

          {/* Magic-link note */}
          <div className="border border-white/6 p-5 mb-8 text-left" style={{ borderRadius: 2 }}>
            <p className="text-[10px] font-body tracking-[0.2em] uppercase mb-2" style={{ color: 'rgba(242,220,169,0.4)' }}>Check your email</p>
            <p className="text-[12px] font-body leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
              We've sent a sign-in link to <span className="text-white">{form.client_email}</span>. Use it anytime to view your booking, message your creator, and access your gallery — no password needed.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link to="/client-dashboard"
              className="w-full py-3.5 text-[11px] font-body tracking-[0.08em] uppercase font-semibold text-center transition-all"
              style={{ background: '#F2DCA9', color: '#0a0a0a', borderRadius: 2 }}>
              View your booking
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

        {/* Back */}
        <Link to={`/lensman/${lensmanId}`}
          className="inline-flex items-center gap-2 text-[10px] font-body tracking-[0.1em] uppercase mb-10 transition-colors"
          style={{ color: 'rgba(255,255,255,0.2)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}>
          <ArrowLeft className="w-3 h-3" /> Back to profile
        </Link>

        {/* Creator header — masked name */}
        <div className="mb-10 pb-8 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-[8px] font-body tracking-[0.4em] uppercase mb-2" style={{ color: 'rgba(242,220,169,0.4)' }}>
            Booking with
          </p>
          <h2 className="font-display text-white font-semibold" style={{ fontSize: 'clamp(24px, 4vw, 40px)' }}>
            {displayName}
          </h2>
          {lensman && (
            <p className="text-[10px] font-body mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {lensman.neighborhoods?.slice(0,2).join(' · ')}
            </p>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-10">
          {STEPS.map((label, i) => {
            const s = i + 1;
            const active = step === s;
            const done = step > s;
            return (
              <React.Fragment key={s}>
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
              </React.Fragment>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.3, ease: [0.16,1,0.3,1] }}>

            {/* STEP 1: Product + Event Type */}
            {step === 1 && (
              <div>
                <h3 className="font-display text-white font-semibold mb-8" style={{ fontSize: 'clamp(22px, 3.5vw, 34px)' }}>
                  What's the moment?
                </h3>

                <p className="text-[10px] font-body tracking-[0.3em] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.2)' }}>Choose a product</p>
                <div className="space-y-2 mb-8">
                  {PRODUCTS.filter(p => {
                    if (!lensman) return true;
                    return !!lensman[p.rateKey];
                  }).map(product => (
                    <button key={product.type} onClick={() => update('package_type', product.type)}
                      className="w-full flex items-center justify-between px-5 py-4 border text-left transition-all"
                      style={{
                        borderColor: form.package_type === product.type ? 'rgba(242,220,169,0.4)' : 'rgba(255,255,255,0.06)',
                        background: form.package_type === product.type ? 'rgba(242,220,169,0.05)' : 'transparent',
                        borderRadius: 2,
                      }}>
                      <div>
                        <p className="font-display text-[16px] font-semibold"
                          style={{ color: form.package_type === product.type ? '#F2DCA9' : 'rgba(255,255,255,0.6)' }}>
                          {product.name}
                        </p>
                        <p className="text-[11px] font-body mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>{product.tagline}</p>
                      </div>
                      <p className="font-display text-[20px] font-semibold ml-6 flex-shrink-0"
                        style={{ color: form.package_type === product.type ? '#F2DCA9' : 'rgba(255,255,255,0.3)' }}>
                        ${lensman?.[product.rateKey] || product.defaultPrice}
                      </p>
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

            {/* STEP 2: Date, Time, Location, Description */}
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
                  <Field label="Approx. attendees">
                    <input type="number" placeholder="How many people?" value={form.attendees} onChange={e => update('attendees', e.target.value)} />
                  </Field>
                  <Field label="Tell us about the moment">
                    <textarea placeholder="What do you want captured? Any vibe, any shot you can't miss." value={form.event_description}
                      onChange={e => update('event_description', e.target.value)} rows={3} />
                  </Field>
                </div>

                {/* Add-ons */}
                <div className="mt-8">
                  <p className="text-[10px] font-body tracking-[0.3em] uppercase mb-3" style={{ color: 'rgba(255,255,255,0.2)' }}>Add-ons</p>
                  <div className="space-y-2">
                    {ADDONS.map(addon => (
                      <button key={addon.id} onClick={() => toggleAddon(addon.id)}
                        className="w-full flex items-center justify-between px-5 py-3 border text-left transition-all"
                        style={{
                          borderColor: form.add_ons.includes(addon.id) ? 'rgba(242,220,169,0.4)' : 'rgba(255,255,255,0.06)',
                          background: form.add_ons.includes(addon.id) ? 'rgba(242,220,169,0.05)' : 'transparent',
                          borderRadius: 2,
                        }}>
                        <span className="flex items-center gap-3">
                          <span className="w-3.5 h-3.5 border flex items-center justify-center flex-shrink-0"
                            style={{ borderColor: form.add_ons.includes(addon.id) ? '#F2DCA9' : 'rgba(255,255,255,0.15)', background: form.add_ons.includes(addon.id) ? '#F2DCA9' : 'transparent' }}>
                            {form.add_ons.includes(addon.id) && <Check className="w-2.5 h-2.5" style={{ color: '#0a0a0a' }} strokeWidth={3} />}
                          </span>
                          <span className="text-[12px] font-body" style={{ color: form.add_ons.includes(addon.id) ? '#F2DCA9' : 'rgba(255,255,255,0.4)' }}>{addon.label}</span>
                        </span>
                        <span className="text-[11px] font-body" style={{ color: 'rgba(255,255,255,0.2)' }}>+${addon.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Client info — guest checkout feel */}
            {step === 3 && (
              <div>
                <h3 className="font-display text-white font-semibold mb-3" style={{ fontSize: 'clamp(22px, 3.5vw, 34px)' }}>
                  Just the essentials.
                </h3>
                <p className="font-body text-[12px] mb-8 leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  No password. No account setup. We'll email you a link to view your booking and gallery.
                </p>

                <div className="space-y-4">
                  <Field label="Your name *">
                    <input type="text" placeholder="Full name" value={form.client_name} onChange={e => update('client_name', e.target.value)} />
                  </Field>
                  <Field label="Email *">
                    <input type="email" placeholder="you@email.com" value={form.client_email} onChange={e => update('client_email', e.target.value)} />
                  </Field>
                  <Field label="Phone">
                    <input type="tel" placeholder="(555) 123-4567" value={form.client_phone} onChange={e => update('client_phone', e.target.value)} />
                  </Field>
                </div>

                {/* Co-booking */}
                <div className="mt-8 pt-7 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[12px] font-body font-semibold text-white">Splitting with friends?</p>
                    <span className="text-[9px] font-body tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>Optional</span>
                  </div>
                  <p className="text-[11px] font-body mb-4 leading-relaxed" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    Invite others to chip in. Each person pays their share and gets access to the final gallery.
                  </p>
                  <div className="flex gap-2 mb-3">
                    <input type="email" placeholder="friend@email.com" value={coBookerInput}
                      onChange={e => setCoBookerInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addCoBooker()}
                      className="flex-1 h-10 px-4 text-[12px] font-body bg-transparent border outline-none"
                      style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderRadius: 2 }}
                    />
                    <button onClick={addCoBooker} className="px-4 h-10 text-[11px] font-body border transition-all"
                      style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', borderRadius: 2 }}>
                      Add
                    </button>
                  </div>
                  {form.co_bookers.map(email => (
                    <div key={email} className="flex items-center justify-between py-2 px-4 mb-1.5"
                      style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                      <span className="text-[12px] font-body" style={{ color: 'rgba(255,255,255,0.4)' }}>{email}</span>
                      <button onClick={() => setForm(prev => ({ ...prev, co_bookers: prev.co_bookers.filter(e => e !== email) }))}>
                        <X className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
                      </button>
                    </div>
                  ))}
                  {form.co_bookers.length > 0 && (
                    <div className="mt-4 px-4 py-3" style={{ background: 'rgba(242,220,169,0.05)', borderRadius: 2 }}>
                      <p className="text-[11px] font-body" style={{ color: '#F2DCA9' }}>
                        Each person pays ${Math.ceil(totalPrice / (form.co_bookers.length + 1))} · split {form.co_bookers.length + 1} ways
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: Review + Confirm */}
            {step === 4 && (
              <div>
                <h3 className="font-display text-white font-semibold mb-8" style={{ fontSize: 'clamp(22px, 3.5vw, 34px)' }}>
                  Review your booking.
                </h3>

                <div className="space-y-0 mb-8">
                  {[
                    { label: 'Creator', value: displayName },
                    { label: 'Date', value: form.event_date && new Date(form.event_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }) },
                    { label: 'Event', value: EVENT_TYPES.find(t => t.value === form.event_type)?.label },
                    { label: 'Location', value: form.location },
                    { label: 'Product', value: PRODUCTS.find(p => p.type === form.package_type)?.name },
                    ...(form.add_ons.length ? [{ label: 'Add-ons', value: form.add_ons.map(id => ADDONS.find(a => a.id === id)?.label).join(', ') }] : []),
                  ].filter(r => r.value).map((row, i) => (
                    <div key={i} className="flex justify-between py-3.5 border-b text-[12px] font-body"
                      style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>{row.label}</span>
                      <span className="text-white text-right max-w-[55%]">{row.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-4 text-[15px] font-body font-semibold">
                    <span className="text-white">Total</span>
                    <span style={{ color: '#F2DCA9' }}>${totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* Escrow trust statement — plain English */}
                <div className="flex items-start gap-4 p-5 mb-6"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 2 }}>
                  <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'rgba(242,220,169,0.5)' }} />
                  <p className="text-[12px] font-body leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    We hold your payment safely until your photos are delivered. Nothing leaves until the work is done.
                  </p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <button onClick={() => setAgreed(!agreed)}
                    className="w-4 h-4 border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
                    style={{ borderColor: agreed ? '#F2DCA9' : 'rgba(255,255,255,0.2)', background: agreed ? '#F2DCA9' : 'transparent' }}>
                    {agreed && <Check className="w-3 h-3" style={{ color: '#0a0a0a' }} strokeWidth={3} />}
                  </button>
                  <span className="text-[12px] font-body leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    I agree to the terms and understand the cancellation policy.
                  </span>
                </label>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-8 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button onClick={() => setStep(s => s - 1)} disabled={step === 1}
            className="flex items-center gap-2 text-[11px] font-body tracking-[0.06em] uppercase transition-all"
            style={{ color: step === 1 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.3)' }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          {step < 4 ? (
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
            <button onClick={handleSubmit} disabled={!agreed || createBooking.isPending}
              className="flex items-center gap-2 text-[11px] font-body tracking-[0.06em] uppercase font-semibold px-7 py-3 transition-all"
              style={{
                background: agreed && !createBooking.isPending ? '#F2DCA9' : 'rgba(255,255,255,0.06)',
                color: agreed && !createBooking.isPending ? '#0a0a0a' : 'rgba(255,255,255,0.2)',
                borderRadius: 2,
              }}>
              {createBooking.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Confirm & pay
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Reusable dark field wrapper
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