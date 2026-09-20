import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, Save, Loader2, ExternalLink } from 'lucide-react';

function slugify(value = '') {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const emptyProfile = {
  display_name: '', slug: '', profile_headline: '', profile_tagline: '', bio: '', booking_cta: '', featured_quote: '',
  profile_theme: 'editorial_cream', gallery_style: 'hero_grid', profile_image: '', portfolio_images: [], specialties: [], neighborhoods: [],
  rate_half_day: '', rate_full_day: '', rate_custom: '', custom_package_description: '', style_tags: [],
};

export default function ProfileEditor() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyProfile);
  const [uploading, setUploading] = useState(false);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { data: lensman, isLoading } = useQuery({
    queryKey: ['my-lensman-profile', user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const list = await base44.entities.Lensman.filter({ email: user.email });
      return list[0] || null;
    },
  });

  useEffect(() => {
    if (!lensman) return;
    setForm({
      ...emptyProfile,
      ...lensman,
      slug: lensman.slug || slugify(lensman.display_name || lensman.full_name),
      profile_headline: lensman.profile_headline || `Book ${lensman.display_name || lensman.full_name} safely through Stelli.`,
      profile_tagline: lensman.profile_tagline || lensman.specialties?.slice(0, 3).join(' · ') || '',
      booking_cta: lensman.booking_cta || 'Book safely through Stelli',
      portfolio_images: lensman.portfolio_images || [],
      specialties: lensman.specialties || [],
      neighborhoods: lensman.neighborhoods || [],
      style_tags: lensman.style_tags || [],
    });
  }, [lensman]);

  const saveProfile = useMutation({
    mutationFn: () => base44.entities.Lensman.update(lensman.id, {
      display_name: form.display_name,
      slug: slugify(form.slug || form.display_name || lensman.full_name),
      profile_headline: form.profile_headline,
      profile_tagline: form.profile_tagline,
      bio: form.bio,
      booking_cta: form.booking_cta,
      featured_quote: form.featured_quote,
      profile_theme: form.profile_theme,
      gallery_style: form.gallery_style,
      profile_image: form.profile_image,
      portfolio_images: form.portfolio_images || [],
      specialties: form.specialties || [],
      neighborhoods: form.neighborhoods || [],
      style_tags: form.style_tags || [],
      custom_package_description: form.custom_package_description,
      rate_half_day: parseInt(form.rate_half_day) || 0,
      rate_full_day: parseInt(form.rate_full_day) || 0,
      rate_custom: parseInt(form.rate_custom) || 0,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-lensman-profile'] }),
  });

  const publicSlug = useMemo(() => slugify(form.slug || form.display_name || lensman?.full_name || ''), [form.slug, form.display_name, lensman?.full_name]);
  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const uploadImages = async (e, mode) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const urls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    if (mode === 'profile') update('profile_image', urls[0]);
    else update('portfolio_images', [...(form.portfolio_images || []), ...urls]);
    setUploading(false);
  };

  if (isLoading) return <div className="p-8 border" style={{ borderColor: 'rgba(26,39,68,0.12)' }}>Loading your profile…</div>;
  if (!lensman) {
    return (
      <div className="p-8 border text-center" style={{ borderColor: 'rgba(26,39,68,0.12)', background: '#ece9e2' }}>
        <h2 className="font-display text-3xl font-semibold mb-3" style={{ color: '#1a2744' }}>No creator profile yet.</h2>
        <p className="text-sm mb-6" style={{ color: 'rgba(26,39,68,0.45)' }}>Apply first, then your editable Stelli profile will appear here.</p>
        <Link to="/apply" className="inline-flex px-6 py-3 rounded-full text-[10px] font-body tracking-[0.08em] uppercase font-semibold" style={{ background: '#1a2744', color: '#f0ede6' }}>Apply to join</Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
      <div className="space-y-6">
        <section className="border p-6" style={{ background: '#ece9e2', borderColor: 'rgba(26,39,68,0.12)' }}>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-[8px] font-body tracking-[0.45em] uppercase mb-2" style={{ color: 'rgba(26,39,68,0.3)' }}>Public profile</p>
              <h2 className="font-display text-3xl font-semibold" style={{ color: '#1a2744' }}>Customize your Stelli link</h2>
            </div>
            <Link to={`/creators/${publicSlug}`} className="hidden sm:inline-flex items-center gap-2 text-[10px] font-body tracking-[0.08em] uppercase" style={{ color: 'rgba(26,39,68,0.45)' }}>
              Preview <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Display name"><input value={form.display_name || ''} onChange={e => update('display_name', e.target.value)} placeholder="Calvin" /></Field>
            <Field label="Public URL"><input value={form.slug || ''} onChange={e => update('slug', e.target.value)} placeholder="calvin" /></Field>
          </div>
          <Field label="Hero headline"><input value={form.profile_headline || ''} onChange={e => update('profile_headline', e.target.value)} placeholder="Your next favorite night, photographed." /></Field>
          <Field label="Short tagline"><input value={form.profile_tagline || ''} onChange={e => update('profile_tagline', e.target.value)} placeholder="direct flash · nightlife · portraits" /></Field>
          <Field label="Bio"><textarea rows={5} value={form.bio || ''} onChange={e => update('bio', e.target.value)} placeholder="Tell clients what you shoot and what it feels like to work with you." /></Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Booking button"><input value={form.booking_cta || ''} onChange={e => update('booking_cta', e.target.value)} placeholder="Book safely through Stelli" /></Field>
            <Field label="Featured quote"><input value={form.featured_quote || ''} onChange={e => update('featured_quote', e.target.value)} placeholder="I shoot the night the way it felt." /></Field>
          </div>
        </section>

        <section className="border p-6" style={{ background: '#ece9e2', borderColor: 'rgba(26,39,68,0.12)' }}>
          <h3 className="font-display text-2xl font-semibold mb-5" style={{ color: '#1a2744' }}>Images</h3>
          <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-6">
            <div>
              <p className="text-[10px] font-body tracking-[0.18em] uppercase mb-3" style={{ color: 'rgba(26,39,68,0.35)' }}>Profile image</p>
              <label className="block aspect-[4/5] cursor-pointer overflow-hidden border" style={{ borderColor: 'rgba(26,39,68,0.14)', background: '#ded9cf' }}>
                {form.profile_image ? <img src={form.profile_image} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Upload className="w-5 h-5" style={{ color: 'rgba(26,39,68,0.35)' }} /></div>}
                <input type="file" accept="image/*" onChange={e => uploadImages(e, 'profile')} className="hidden" />
              </label>
            </div>
            <div>
              <p className="text-[10px] font-body tracking-[0.18em] uppercase mb-3" style={{ color: 'rgba(26,39,68,0.35)' }}>Portfolio gallery</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {(form.portfolio_images || []).slice(0, 9).map((url, i) => (
                  <div key={i} className="aspect-square overflow-hidden relative group">
                    <img src={url} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover" />
                    <button onClick={() => update('portfolio_images', form.portfolio_images.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-[#1a2744]/70 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">Remove</button>
                  </div>
                ))}
                <label className="aspect-square flex items-center justify-center cursor-pointer border" style={{ borderColor: 'rgba(26,39,68,0.14)' }}>
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  <input type="file" multiple accept="image/*" onChange={e => uploadImages(e, 'portfolio')} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="border p-6" style={{ background: '#ece9e2', borderColor: 'rgba(26,39,68,0.12)' }}>
          <h3 className="font-display text-2xl font-semibold mb-5" style={{ color: '#1a2744' }}>Booking products</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Half day"><input type="number" value={form.rate_half_day || ''} onChange={e => update('rate_half_day', e.target.value)} /></Field>
            <Field label="Full day"><input type="number" value={form.rate_full_day || ''} onChange={e => update('rate_full_day', e.target.value)} /></Field>
            <Field label="Custom"><input type="number" value={form.rate_custom || ''} onChange={e => update('rate_custom', e.target.value)} /></Field>
          </div>
          <Field label="Custom package description"><input value={form.custom_package_description || ''} onChange={e => update('custom_package_description', e.target.value)} /></Field>
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 h-fit border p-6" style={{ background: '#f0ede6', borderColor: 'rgba(26,39,68,0.12)' }}>
        <p className="text-[8px] font-body tracking-[0.45em] uppercase mb-4" style={{ color: 'rgba(26,39,68,0.3)' }}>Live preview</p>
        <div className="border overflow-hidden mb-5" style={{ borderColor: 'rgba(26,39,68,0.12)', background: '#ece9e2' }}>
          <div className="aspect-[4/5] bg-[#ded9cf]">{form.profile_image && <img src={form.profile_image} alt="Preview" className="w-full h-full object-cover" />}</div>
          <div className="p-5">
            <p className="font-display text-3xl font-semibold leading-none" style={{ color: '#1a2744' }}>{form.display_name || lensman.full_name}</p>
            <p className="text-[11px] font-body mt-2" style={{ color: 'rgba(26,39,68,0.42)' }}>{form.profile_tagline || 'your style · your city'}</p>
            <p className="text-[9px] font-body tracking-[0.16em] uppercase mt-5" style={{ color: 'rgba(26,39,68,0.3)' }}>getstelli.com/creators/{publicSlug}</p>
          </div>
        </div>
        <button onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending || uploading} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-[10px] font-body tracking-[0.08em] uppercase font-semibold disabled:opacity-50" style={{ background: '#1a2744', color: '#f0ede6' }}>
          {saveProfile.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save profile
        </button>
        {saveProfile.isSuccess && <p className="text-center text-[11px] mt-3" style={{ color: 'rgba(26,39,68,0.45)' }}>Profile saved.</p>}
      </aside>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-4">
      <span className="block text-[10px] font-body tracking-[0.18em] uppercase mb-2" style={{ color: 'rgba(26,39,68,0.35)' }}>{label}</span>
      {React.cloneElement(children, {
        className: 'w-full px-4 py-3 bg-transparent border outline-none text-[13px] font-body',
        style: { borderColor: 'rgba(26,39,68,0.14)', color: '#1a2744' },
      })}
    </label>
  );
}