import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, ArrowRight, Check, Upload, Star, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const SPECIALTIES = ['Portraits', 'Events', 'Commercial', 'Music Videos', 'Weddings', 'Food & Restaurant', 'Fashion', 'Documentary', 'Product'];
const NEIGHBORHOODS = ['Bushwick', 'Williamsburg', 'Ridgewood', 'Greenpoint', 'Bed-Stuy', 'Crown Heights', 'Park Slope', 'DUMBO', 'LES', 'East Village', 'Harlem', 'Astoria', 'Other'];

export default function CreatorApplication() {
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '',
    neighborhoods: [], years_experience: '',
    portfolio_images: [], bio: '', specialties: [],
    equipment: '', rate_half_day: '', rate_full_day: '', rate_custom: '',
    custom_package_description: '',
    blackout_dates: [],
  });

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const toggleArrayItem = (key, item) => {
    setForm(prev => ({
      ...prev,
      [key]: prev[key].includes(item) ? prev[key].filter(i => i !== item) : [...prev[key], item],
    }));
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);
    const urls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    update('portfolio_images', [...form.portfolio_images, ...urls]);
    setUploading(false);
  };

  const createLensman = useMutation({
    mutationFn: (data) => base44.entities.Lensman.create(data),
    onSuccess: () => setStep(5),
  });

  const handleSubmit = () => {
    createLensman.mutate({
      ...form,
      years_experience: parseInt(form.years_experience) || 0,
      rate_half_day: parseInt(form.rate_half_day) || 800,
      rate_full_day: parseInt(form.rate_full_day) || 1200,
      rate_custom: parseInt(form.rate_custom) || 0,
      display_name: form.full_name.split(' ').map(n => n[0]).join(''),
      status: 'pending',
      avg_rating: 5.0,
      review_count: 0,
      style_tags: [],
    });
  };

  const canProceed = () => {
    switch (step) {
      case 1: return form.full_name && form.email && form.neighborhoods.length > 0;
      case 2: return form.portfolio_images.length >= 5;
      case 3: return form.bio && form.specialties.length > 0;
      case 4: return form.rate_half_day;
      default: return true;
    }
  };

  if (step === 5) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-20">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="font-display text-3xl font-semibold mb-3">Application submitted!</h1>
          <p className="text-muted-foreground mb-8">
            We'll review your portfolio and get back to you within 48 hours. Keep an eye on your email.
          </p>
          <Link to="/">
            <Button className="rounded-full bg-foreground text-background">Back to Home</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream star-bg">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link to="/for-creators" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="text-center mb-10">
          <Star className="w-5 h-5 text-gold fill-gold mx-auto mb-3" />
          <h1 className="font-display text-2xl sm:text-3xl font-semibold">Join Stelli as a Creator</h1>
          <p className="text-sm text-muted-foreground mt-2">Step {step} of 4</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-10">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${step >= s ? 'bg-foreground' : 'bg-border'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {step === 1 && (
              <div className="bg-card border border-border rounded-2xl p-8 space-y-5">
                <h2 className="font-display text-xl font-semibold">Basic Information</h2>
                <div>
                  <Label className="text-sm mb-1.5 block">Full Name *</Label>
                  <Input value={form.full_name} onChange={e => update('full_name', e.target.value)} className="rounded-xl" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm mb-1.5 block">Email *</Label>
                    <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} className="rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-sm mb-1.5 block">Phone</Label>
                    <Input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} className="rounded-xl" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm mb-1.5 block">Years of experience</Label>
                  <Input type="number" value={form.years_experience} onChange={e => update('years_experience', e.target.value)} className="rounded-xl w-32" />
                </div>
                <div>
                  <Label className="text-sm mb-3 block">Neighborhoods where you work *</Label>
                  <div className="flex flex-wrap gap-2">
                    {NEIGHBORHOODS.map(n => (
                      <button key={n} onClick={() => toggleArrayItem('neighborhoods', n)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          form.neighborhoods.includes(n) ? 'bg-foreground text-background border-foreground' : 'bg-card border-border hover:border-foreground/30'
                        }`}>{n}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="bg-card border border-border rounded-2xl p-8 space-y-5">
                <h2 className="font-display text-xl font-semibold">Portfolio Upload</h2>
                <p className="text-sm text-muted-foreground">Upload at least 5 of your best photos (15–20 recommended).</p>

                <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-10 cursor-pointer hover:border-foreground/30 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mb-3" />
                  <span className="text-sm font-medium">Click to upload photos</span>
                  <span className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP</span>
                  <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>

                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                  </div>
                )}

                {form.portfolio_images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {form.portfolio_images.map((url, i) => (
                      <div key={i} className="aspect-square rounded-lg overflow-hidden">
                        <img src={url} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{form.portfolio_images.length} photos uploaded</p>
              </div>
            )}

            {step === 3 && (
              <div className="bg-card border border-border rounded-2xl p-8 space-y-5">
                <h2 className="font-display text-xl font-semibold">Bio & Specialties</h2>
                <div>
                  <Label className="text-sm mb-1.5 block">Tell us about yourself *</Label>
                  <Textarea value={form.bio} onChange={e => update('bio', e.target.value)} className="rounded-xl min-h-[120px]" placeholder="Why do you create? What draws you to this work?" />
                </div>
                <div>
                  <Label className="text-sm mb-3 block">Specialties *</Label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALTIES.map(s => (
                      <button key={s} onClick={() => toggleArrayItem('specialties', s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          form.specialties.includes(s) ? 'bg-foreground text-background border-foreground' : 'bg-card border-border hover:border-foreground/30'
                        }`}>{s}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm mb-1.5 block">Equipment (optional)</Label>
                  <Input value={form.equipment} onChange={e => update('equipment', e.target.value)} className="rounded-xl" placeholder="Camera, lenses, lighting..." />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="bg-card border border-border rounded-2xl p-8 space-y-5">
                <h2 className="font-display text-xl font-semibold">Pricing</h2>
                <p className="text-sm text-muted-foreground">Set your day rates. You can always change these later.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm mb-1.5 block">Half Day Rate (4 hours) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input type="number" value={form.rate_half_day} onChange={e => update('rate_half_day', e.target.value)} className="rounded-xl pl-7" placeholder="800" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm mb-1.5 block">Full Day Rate (8 hours)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input type="number" value={form.rate_full_day} onChange={e => update('rate_full_day', e.target.value)} className="rounded-xl pl-7" placeholder="1200" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm mb-1.5 block">Custom Package Rate</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input type="number" value={form.rate_custom} onChange={e => update('rate_custom', e.target.value)} className="rounded-xl pl-7" placeholder="2000" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm mb-1.5 block">Custom Package Description</Label>
                    <Input value={form.custom_package_description} onChange={e => update('custom_package_description', e.target.value)} className="rounded-xl" placeholder="e.g. 8-hour wedding" />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 1} className="rounded-full">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} className="rounded-full bg-foreground text-background hover:bg-foreground/90">
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canProceed() || createLensman.isPending} className="rounded-full bg-foreground text-background hover:bg-foreground/90">
              {createLensman.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Submit Application
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}