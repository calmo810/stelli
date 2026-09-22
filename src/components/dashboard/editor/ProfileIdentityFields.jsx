import React from 'react';
import { Loader2, Upload } from 'lucide-react';
import { ACCEPT_ATTR } from '@/lib/imageQuality';

const fieldClass =
  'w-full border bg-white/[0.03] px-4 py-3 font-body text-[13px] text-white outline-none transition-colors placeholder:text-white/25 focus:border-neon-lime';

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="label-mono block text-[9px] text-white/40 mb-2">{label}</span>
      {React.cloneElement(children, {
        className: fieldClass,
        style: { borderColor: 'rgba(255,255,255,0.1)', borderRadius: 4 },
      })}
    </label>
  );
}

export default function ProfileIdentityFields({ form, onChange, onImageUpload, uploading }) {
  const update = (key) => (event) => onChange({ [key]: event.target.value });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Display name">
          <input value={form.display_name || ''} onChange={update('display_name')} placeholder="Calvin" />
        </Field>
        <Field label="Public URL">
          <input value={form.slug || ''} onChange={update('slug')} placeholder="calvin" />
        </Field>
      </div>

      <Field label="Hero headline">
        <input value={form.profile_headline || ''} onChange={update('profile_headline')} placeholder="Your next favorite night, photographed." />
      </Field>

      <Field label="Short tagline">
        <input value={form.profile_tagline || ''} onChange={update('profile_tagline')} placeholder="direct flash · nightlife · portraits" />
      </Field>

      <Field label="Bio">
        <textarea rows={4} value={form.bio || ''} onChange={update('bio')} placeholder="Tell clients what you shoot and what it feels like to work with you." />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Booking button">
          <input value={form.booking_cta || ''} onChange={update('booking_cta')} placeholder="Request a date" />
        </Field>
        <Field label="Featured quote">
          <input value={form.featured_quote || ''} onChange={update('featured_quote')} placeholder="I shoot the night the way it felt." />
        </Field>
      </div>

      <div className="grid grid-cols-[96px_1fr] gap-5 items-start pt-1">
        <div>
          <p className="label-mono text-[9px] text-white/40 mb-2">Portrait</p>
          <label
            className="block aspect-[4/5] cursor-pointer overflow-hidden border"
            style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', borderRadius: 3 }}
          >
            {form.profile_image ? (
              <img src={form.profile_image} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full flex items-center justify-center">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin text-white/40" /> : <Upload className="w-4 h-4 text-white/40" />}
              </span>
            )}
            <input type="file" accept={ACCEPT_ATTR} onChange={onImageUpload} className="hidden" />
          </label>
        </div>
        <p className="font-body text-[11px] leading-relaxed text-white/30 pt-6">
          Your portrait is used for messages and dashboards. The cover shot below is what clients see first on your public profile.
        </p>
      </div>
    </div>
  );
}