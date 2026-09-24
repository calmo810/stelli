import React from 'react';

const fieldClass =
  'w-full border border-white/10 bg-white/[0.03] px-4 py-3 font-body text-[14px] text-white outline-none transition-colors placeholder:text-white/25 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan';

function Field({ id, label, hint, error, children }) {
  return (
    <label className="block" id={id}>
      <span className="block label-mono text-[10px] text-white/40 mb-2.5">{label}</span>
      {children}
      {hint && <span className="block font-body text-[11px] text-white/50 mt-2">{hint}</span>}
      {error && <span className="block font-body text-[11px] mt-2" style={{ color: 'hsl(var(--neon-magenta))' }}>{error}</span>}
    </label>
  );
}

/**
 * Only Stelli sees any of this. The real name, contact email, phone and
 * Instagram all save to the private CreatorContact record.
 */
export default function PrivateFields({ form, onChange, errors }) {
  const set = (key) => (event) => onChange({ [key]: event.target.value });

  return (
    <section className="border p-6 space-y-6" style={{ background: 'hsl(var(--surface))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>
      <div>
        <h3 className="font-heading text-2xl font-semibold text-white mb-2">Private</h3>
        <p className="font-body text-[12px] text-white/50">
          Only Stelli sees this. Clients get your contact info once a booking is confirmed.
        </p>
      </div>

      <Field id="full_name" label="Full name" hint="For our records. It isn't shown on your profile." error={errors?.full_name}>
        <input type="text" value={form.full_name || ''} onChange={set('full_name')} className={fieldClass} />
      </Field>

      <Field id="email" label="Contact email" hint="Where we send booking updates." error={errors?.email}>
        <input type="email" value={form.email || ''} onChange={set('email')} className={fieldClass} />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field id="phone" label="Phone" hint="For our records. It isn't shown on your profile." error={errors?.phone}>
          <input type="tel" value={form.phone || ''} onChange={set('phone')} className={fieldClass} />
        </Field>

        <Field id="instagram" label="Instagram" hint="For our records. It isn't shown on your profile." error={errors?.instagram}>
          <input type="text" value={form.instagram || ''} onChange={set('instagram')} placeholder="@handle" className={fieldClass} />
        </Field>
      </div>
    </section>
  );
}