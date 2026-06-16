import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ArrowRight, Check, Star, Shield, Loader2, Users, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

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
  { value: 'custom', label: 'Custom' },
];

const ADDONS = [
  { id: 'rush', label: 'Rush delivery (5 days)', price: 150 },
  { id: 'raw', label: 'Raw files included', price: 100 },
  { id: 'bts', label: 'Behind-the-scenes video', price: 200 },
];

export default function BookingFlow() {
  const { lensmanId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({
    event_date: '', event_time: '', event_type: '', location: '',
    event_description: '', attendees: '',
    package_type: 'half_day', add_ons: [],
    client_name: '', client_email: '', client_phone: '', billing_address: '',
    co_bookers: [],
  });
  const [coBookerInput, setCoBookerInput] = useState('');

  const { data: lensman } = useQuery({
    queryKey: ['lensman', lensmanId],
    queryFn: async () => {
      const list = await base44.entities.Lensman.filter({ id: lensmanId });
      return list[0];
    },
  });

  const createBooking = useMutation({
    mutationFn: (data) => base44.entities.Booking.create(data),
    onSuccess: () => setStep(5),
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

  const getPackagePrice = () => {
    if (!lensman) return 0;
    switch (form.package_type) {
      case 'half_day': return lensman.rate_half_day || 800;
      case 'full_day': return lensman.rate_full_day || 1200;
      case 'custom': return lensman.rate_custom || 2000;
      default: return 0;
    }
  };

  const getAddonsPrice = () =>
    form.add_ons.reduce((sum, id) => sum + (ADDONS.find(a => a.id === id)?.price || 0), 0);

  const totalPrice = getPackagePrice() + getAddonsPrice();

  const handleSubmit = () => {
    const deliveryDate = new Date(form.event_date);
    deliveryDate.setDate(deliveryDate.getDate() + (form.add_ons.includes('rush') ? 5 : 14));

    createBooking.mutate({
      lensman_id: lensmanId,
      lensman_name: lensman?.display_name || lensman?.full_name,
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
      billing_address: form.billing_address,
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
  const removeCoBooker = (email) => setForm(prev => ({ ...prev, co_bookers: prev.co_bookers.filter(e => e !== email) }));

  const canProceed = () => {
    switch (step) {
      case 1: return form.event_date && form.event_type && form.location;
      case 2: return form.package_type;
      case 3: return form.client_name && form.client_email;
      case 4: return true; // group booking optional
      case 5: return agreed;
      default: return true;
    }
  };

  // Confirmation page
  if (step === 5) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-20">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="font-display text-3xl font-semibold mb-3">Booking confirmed!</h1>
          <p className="text-muted-foreground mb-2">
            Your shoot with <strong>{lensman?.display_name || lensman?.full_name}</strong> is booked for{' '}
            <strong>{new Date(form.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Your creator will reach out within 24 hours to coordinate details. Payment is held safely until delivery.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/client-dashboard">
              <Button className="rounded-full bg-foreground text-background">Go to Dashboard</Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="rounded-full">Back to Home</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream star-bg">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Back */}
        <Link to={`/lensman/${lensmanId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to profile
        </Link>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          {[1, 2, 3, 4, 5].map(s => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                step >= s ? 'bg-foreground text-background' : 'bg-border text-muted-foreground'
              }`}>{s}</div>
              {s < 4 && <div className={`flex-1 h-px transition-colors ${step > s ? 'bg-foreground' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {/* Step 1: Event Details */}
            {step === 1 && (
              <div className="bg-card border border-border rounded-2xl p-8">
                <h2 className="font-display text-2xl font-semibold mb-6">Event Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <Label className="text-sm mb-1.5 block">Event Date *</Label>
                    <Input type="date" value={form.event_date} onChange={e => update('event_date', e.target.value)} className="rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-sm mb-1.5 block">Start Time</Label>
                    <Input type="time" value={form.event_time} onChange={e => update('event_time', e.target.value)} className="rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-sm mb-1.5 block">Event Type *</Label>
                    <Select value={form.event_type} onValueChange={v => update('event_type', v)}>
                      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select event type" /></SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm mb-1.5 block">Attendees</Label>
                    <Input type="number" placeholder="Approximate number" value={form.attendees} onChange={e => update('attendees', e.target.value)} className="rounded-xl" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-sm mb-1.5 block">Location *</Label>
                    <Input placeholder="Address or neighborhood" value={form.location} onChange={e => update('location', e.target.value)} className="rounded-xl" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-sm mb-1.5 block">Tell us about your event</Label>
                    <Textarea placeholder="What do you want captured? Any specific shots or vibes?" value={form.event_description} onChange={e => update('event_description', e.target.value)} className="rounded-xl min-h-[100px]" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Package */}
            {step === 2 && (
              <div className="bg-card border border-border rounded-2xl p-8">
                <h2 className="font-display text-2xl font-semibold mb-6">Choose Your Package</h2>
                <RadioGroup value={form.package_type} onValueChange={v => update('package_type', v)} className="space-y-3">
                  {[
                    { value: 'half_day', name: 'Half Day', desc: '4-hour shoot · Edited photos · Digital delivery', price: lensman?.rate_half_day || 800 },
                    { value: 'full_day', name: 'Full Day', desc: 'Content day or 8-hour shoot · Full photo + video package', price: lensman?.rate_full_day || 1200 },
                    lensman?.rate_custom && { value: 'custom', name: 'Custom', desc: lensman?.custom_package_description || 'Custom package tailored to your needs', price: lensman?.rate_custom },
                  ].filter(Boolean).map(pkg => (
                    <label key={pkg.value} className={`flex items-center gap-4 p-5 rounded-xl border cursor-pointer transition-all ${
                      form.package_type === pkg.value ? 'border-foreground bg-cream' : 'border-border hover:border-foreground/30'
                    }`}>
                      <RadioGroupItem value={pkg.value} />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{pkg.name}</p>
                        <p className="text-xs text-muted-foreground">{pkg.desc}</p>
                      </div>
                      <p className="font-semibold">${pkg.price}</p>
                    </label>
                  ))}
                </RadioGroup>

                <Separator className="my-6" />

                <h3 className="text-sm font-semibold mb-4">Add-ons</h3>
                <div className="space-y-3">
                  {ADDONS.map(addon => (
                    <label key={addon.id} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                      form.add_ons.includes(addon.id) ? 'border-foreground bg-cream' : 'border-border hover:border-foreground/30'
                    }`}>
                      <Checkbox checked={form.add_ons.includes(addon.id)} onCheckedChange={() => toggleAddon(addon.id)} />
                      <span className="text-sm flex-1">{addon.label}</span>
                      <span className="text-sm font-semibold">+${addon.price}</span>
                    </label>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-cream rounded-xl flex items-center justify-between">
                  <span className="text-sm font-medium">Estimated Total</span>
                  <span className="text-xl font-bold">${totalPrice}</span>
                </div>
              </div>
            )}

            {/* Step 3: Client Info */}
            {step === 3 && (
              <div className="bg-card border border-border rounded-2xl p-8">
                <h2 className="font-display text-2xl font-semibold mb-6">Your Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <Label className="text-sm mb-1.5 block">Full Name *</Label>
                    <Input value={form.client_name} onChange={e => update('client_name', e.target.value)} className="rounded-xl" placeholder="Your full name" />
                  </div>
                  <div>
                    <Label className="text-sm mb-1.5 block">Email *</Label>
                    <Input type="email" value={form.client_email} onChange={e => update('client_email', e.target.value)} className="rounded-xl" placeholder="you@email.com" />
                  </div>
                  <div>
                    <Label className="text-sm mb-1.5 block">Phone</Label>
                    <Input type="tel" value={form.client_phone} onChange={e => update('client_phone', e.target.value)} className="rounded-xl" placeholder="(555) 123-4567" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-sm mb-1.5 block">Billing Address</Label>
                    <Input value={form.billing_address} onChange={e => update('billing_address', e.target.value)} className="rounded-xl" placeholder="Street address, city, state, ZIP" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Group Booking (optional) */}
            {step === 4 && (
              <div className="bg-card border border-border rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <h2 className="font-display text-2xl font-semibold">Co-book with friends</h2>
                  <span className="text-xs text-muted-foreground border border-border rounded-full px-2 py-0.5 ml-auto">Optional</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Planning this for someone else? Invite friends to chip in. Each person pays their share — everyone gets access to the final album.
                </p>

                <div className="flex gap-2 mb-4">
                  <input
                    type="email"
                    placeholder="friend@email.com"
                    value={coBookerInput}
                    onChange={e => setCoBookerInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCoBooker()}
                    className="flex-1 h-10 rounded-xl border border-border px-4 text-sm font-body outline-none focus:ring-1 focus:ring-ring"
                  />
                  <button onClick={addCoBooker} className="px-4 h-10 rounded-xl bg-foreground text-background text-sm font-body font-medium hover:bg-foreground/90 transition-all">
                    Add
                  </button>
                </div>

                {form.co_bookers.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {form.co_bookers.map(email => (
                      <div key={email} className="flex items-center justify-between py-2 px-4 bg-cream rounded-xl">
                        <span className="text-sm font-body text-foreground">{email}</span>
                        <button onClick={() => removeCoBooker(email)} className="text-muted-foreground hover:text-foreground">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {form.co_bookers.length > 0 && (
                  <div className="p-4 bg-cream rounded-xl text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Each person pays</p>
                    <p className="text-2xl font-bold text-foreground">${Math.ceil(totalPrice / (form.co_bookers.length + 1))}</p>
                    <p className="text-xs mt-1">Split {form.co_bookers.length + 1} ways · ${totalPrice} total</p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground mt-4">Everyone you invite will receive a link to pay their share and will get access to the final photo album.</p>
              </div>
            )}

            {/* Step 5: Review & Confirm */}
            {step === 5 && (
              <div className="bg-card border border-border rounded-2xl p-8">
                <h2 className="font-display text-2xl font-semibold mb-6">Review & Confirm</h2>

                <div className="space-y-4 text-sm">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Creator</span>
                    <span className="font-medium">{lensman?.display_name || lensman?.full_name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Event Date</span>
                    <span className="font-medium">{form.event_date && new Date(form.event_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Event Type</span>
                    <span className="font-medium capitalize">{form.event_type?.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium">{form.location}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Package</span>
                    <span className="font-medium capitalize">{form.package_type.replace(/_/g, ' ')} — ${getPackagePrice()}</span>
                  </div>
                  {form.add_ons.length > 0 && (
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Add-ons</span>
                      <span className="font-medium">{form.add_ons.map(id => ADDONS.find(a => a.id === id)?.label).join(', ')} — +${getAddonsPrice()}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-3 text-lg">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold">${totalPrice}</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-green-50 rounded-xl flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-green-800 leading-relaxed">
                    Your payment is held safely in escrow until your photos and videos are delivered. You don't pay until you're happy.
                  </p>
                </div>

                <label className="flex items-center gap-3 mt-6 cursor-pointer">
                  <Checkbox checked={agreed} onCheckedChange={setAgreed} />
                  <span className="text-sm text-muted-foreground">I agree to the Terms & Conditions and understand the cancellation policy.</span>
                </label>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {step < 5 && (
          <div className="flex items-center justify-between mt-8">
            <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 1} className="rounded-full">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>

            {step < 5 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} className="rounded-full bg-foreground text-background hover:bg-foreground/90">
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!agreed || createBooking.isPending} className="rounded-full bg-foreground text-background hover:bg-foreground/90">
                {createBooking.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Confirm & Pay
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}