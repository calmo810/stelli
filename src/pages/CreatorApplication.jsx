import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const fieldClass =
  'w-full border border-white/10 bg-white/[0.03] px-4 py-3 font-body text-[14px] text-white outline-none transition-colors placeholder:text-white/25 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan';

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block label-mono text-[10px] text-white/40 mb-2.5">{label}</span>
      {children}
      {hint && <span className="block font-body text-[11px] text-white/50 mt-2">{hint}</span>}
    </label>
  );
}

/**
 * Creator signup — one screen. The profile itself is built afterwards on
 * Edit Profile; this only collects who they are and how to reach them.
 */
export default function CreatorApplication() {
  const [legalAgreed, setLegalAgreed] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    retry: false,
  });

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const contactEmail = form.email || user?.email || '';

  const createLensman = useMutation({
    mutationFn: async (data) => {
      if (!user) {
        base44.auth.redirectToLogin('/apply');
        throw new Error('Please sign in to apply.');
      }
      const response = await base44.functions.invoke('applyAsCreator', data);
      if (response.data?.error) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: async () => {
      if (await base44.auth.isAuthenticated()) {
        await Promise.all([
          base44.functions.invoke('recordAgreementAcceptance', { documentType: 'terms', documentVersion: '2026-09-10' }),
          base44.functions.invoke('recordAgreementAcceptance', { documentType: 'privacy', documentVersion: '2026-09-10' }),
        ]);
      }
      setDone(true);
    },
    onError: (e) => setError(e?.response?.data?.error || e.message || 'We could not file your application.'),
  });

  const submit = () => {
    setError('');
    createLensman.mutate({
      fullName: form.full_name,
      email: contactEmail,
      phone: form.phone,
      market: 'ELON',
    });
  };

  const canSubmit = Boolean(form.full_name.trim() && contactEmail.trim() && legalAgreed && ageConfirmed);

  if (done) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center px-6 py-20">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg text-center">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6" style={{ background: 'hsl(var(--neon-cyan) / 0.15)', borderRadius: 999 }}>
            <Check className="w-8 h-8" style={{ color: 'hsl(var(--neon-cyan))' }} />
          </div>
          <h1 className="font-heading text-3xl font-semibold mb-3 text-white">Your profile is under review.</h1>
          <p className="font-body text-[14px] leading-relaxed text-white/55 mb-8">
            We look at every creator ourselves and we'll be in touch soon. Keep building your profile in the meantime. It goes live the moment you're approved.
          </p>
          <Link
            to="/edit-profile"
            className="inline-flex px-8 py-4 label-mono text-[10px] font-semibold"
            style={{ background: '#2AE8F8', color: '#0a0f1e', borderRadius: 4 }}
          >
            Build your profile.
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink">
      <div className="max-w-xl mx-auto px-5 md:px-8 py-16">
        <h1 className="font-heading text-white font-semibold leading-[0.95] mb-3" style={{ fontSize: 'clamp(32px, 5vw, 52px)' }}>
          Join Stelli.
        </h1>
        <p className="font-body text-[14px] text-white/50 mb-10">
          Three fields, then you build the rest of your profile.
        </p>

        <div className="space-y-6">
          <Field label="Full name">
            <input type="text" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} className={fieldClass} style={{ borderRadius: 4 }} />
          </Field>

          <Field label="Contact email" hint="Where we send booking updates.">
            <input type="email" value={contactEmail} onChange={(e) => update('email', e.target.value)} className={fieldClass} style={{ borderRadius: 4 }} />
          </Field>

          <Field label="Phone">
            <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} className={fieldClass} style={{ borderRadius: 4 }} />
          </Field>

          <label className="flex items-start gap-3 border p-4 cursor-pointer" style={{ borderColor: 'rgba(255,255,255,0.12)', borderRadius: 4 }}>
            <Checkbox checked={legalAgreed} onCheckedChange={setLegalAgreed} className="mt-0.5" />
            <span className="font-body text-[12px] leading-relaxed text-white/55">
              I agree to Stelli's <Link to="/terms" className="text-white underline">Terms and Conditions</Link> and <Link to="/privacy" className="text-white underline">Privacy Policy</Link>.
            </span>
          </label>

          <label className="flex items-start gap-3 border p-4 cursor-pointer" style={{ borderColor: 'rgba(255,255,255,0.12)', borderRadius: 4 }}>
            <Checkbox checked={ageConfirmed} onCheckedChange={setAgeConfirmed} className="mt-0.5" />
            <span className="font-body text-[12px] leading-relaxed text-white/55">I'm 18 or older.</span>
          </label>

          {error && <p className="font-body text-[12px]" style={{ color: 'hsl(var(--neon-magenta))' }}>{error}</p>}

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit || createLensman.isPending}
            className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 label-mono text-[11px] font-semibold disabled:opacity-40"
            style={{ background: '#2AE8F8', color: '#0a0f1e', borderRadius: 4 }}
          >
            {createLensman.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Submit application
          </button>
        </div>
      </div>
    </div>
  );
}