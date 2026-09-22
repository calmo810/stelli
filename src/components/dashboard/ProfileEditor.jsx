import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ExternalLink, Loader2, Save } from 'lucide-react';
import {
  CONTACT_MESSAGE, LIMITS, cleanStyleTags, hasContactDetails, hasLegacyTags,
} from '@/lib/profilePresets';
import { fileProblem, readImageSize, softSizeWarning, coverSizeError } from '@/lib/imageQuality';
import { useMarket } from '@/lib/market';
import useLeaveGuard from '@/hooks/useLeaveGuard';
import LimitedTextField from './editor/LimitedTextField';
import PresetPicker from './editor/PresetPicker';
import CoverPicker from './editor/CoverPicker';
import PortfolioOrder from './editor/PortfolioOrder';
import TagPicker from './editor/TagPicker';
import PromptPicker from './editor/PromptPicker';
import AccentPicker from './editor/AccentPicker';
import EditorPreview from './editor/EditorPreview';
import ProfileIdentityFields from './editor/ProfileIdentityFields';
import UnsavedChangesDialog from './editor/UnsavedChangesDialog';

const emptyProfile = {
  display_name: '', slug: '', profile_headline: '', profile_tagline: '', bio: '', booking_cta: '',
  featured_quote: '', profile_theme: 'night_flash', gallery_style: 'hero_grid', profile_image: '',
  portfolio_images: [], specialties: [], neighborhoods: [], style_tags: [],
  one_liner: '', prompt_question: '', prompt_answer: '', dont_shoot: '',
  accent_color: 'lime', cover_image: '', cover_focal_point: { x: 50, y: 50 },
};

const THEMES = [
  { value: 'night_flash', label: 'Night flash' },
  { value: 'editorial_cream', label: 'Editorial' },
  { value: 'clean_portfolio', label: 'Clean' },
];

const GALLERY_STYLES = [
  { value: 'hero_grid', label: 'Hero grid' },
  { value: 'ordered_grid', label: 'Ordered grid' },
  { value: 'contact_sheet', label: 'Contact sheet' },
];

function slugify(value = '') {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** The exact shape that gets saved — also the basis for unsaved-change tracking. */
function buildPayload(form) {
  return {
    display_name: form.display_name,
    slug: form.slug,
    profile_headline: form.profile_headline,
    profile_tagline: form.profile_tagline,
    bio: form.bio,
    booking_cta: form.booking_cta,
    featured_quote: form.featured_quote,
    profile_theme: form.profile_theme,
    gallery_style: form.gallery_style,
    profile_image: form.profile_image,
    specialties: form.specialties || [],
    neighborhoods: form.neighborhoods || [],
    portfolio_images: form.portfolio_images || [],
    style_tags: cleanStyleTags(form.style_tags),
    one_liner: form.one_liner || '',
    prompt_question: form.prompt_question || '',
    prompt_answer: form.prompt_answer || '',
    dont_shoot: form.dont_shoot || '',
    accent_color: form.accent_color || 'lime',
    cover_image: form.cover_image || '',
    cover_focal_point: form.cover_focal_point || { x: 50, y: 50 },
    pinned_images: (form.portfolio_images || []).slice(0, 3),
  };
}

export default function ProfileEditor({ guardRef }) {
  const queryClient = useQueryClient();
  const { market } = useMarket();
  const [form, setForm] = useState(emptyProfile);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [uploading, setUploading] = useState(false);
  const [warnings, setWarnings] = useState({});
  const [coverError, setCoverError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [serverError, setServerError] = useState(null);
  const [noteDismissed, setNoteDismissed] = useState(false);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { data: lensman, isLoading } = useQuery({
    queryKey: ['my-lensman-profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const list = await base44.entities.Lensman.filter({ user_id: user.id });
      return list[0] || null;
    },
  });

  const noteKey = lensman ? `stelli_tags_note_${lensman.id}` : '';

  useEffect(() => {
    if (!lensman) return;
    const loaded = {
      ...emptyProfile,
      ...lensman,
      slug: lensman.slug || slugify(lensman.display_name || lensman.full_name),
      profile_headline: lensman.profile_headline || `Book ${lensman.display_name || lensman.full_name} safely through Stelli.`,
      profile_tagline: lensman.profile_tagline || lensman.specialties?.slice(0, 3).join(' · ') || '',
      booking_cta: lensman.booking_cta || 'Request a date',
      portfolio_images: lensman.portfolio_images || [],
      specialties: lensman.specialties || [],
      neighborhoods: lensman.neighborhoods || [],
      style_tags: cleanStyleTags(lensman.style_tags),
      cover_focal_point: lensman.cover_focal_point || { x: 50, y: 50 },
    };
    setForm(loaded);
    setSavedSnapshot(JSON.stringify(buildPayload(loaded)));
    setNoteDismissed(Boolean(localStorage.getItem(noteKey)));
  }, [lensman, noteKey]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateMany = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const payload = useMemo(() => buildPayload(form), [form]);

  const dirty = Boolean(lensman) && JSON.stringify(payload) !== savedSnapshot;

  const contactErrors = useMemo(() => ({
    one_liner: hasContactDetails(form.one_liner) ? CONTACT_MESSAGE : '',
    prompt_answer: hasContactDetails(form.prompt_answer) ? CONTACT_MESSAGE : '',
    dont_shoot: hasContactDetails(form.dont_shoot) ? CONTACT_MESSAGE : '',
  }), [form.one_liner, form.prompt_answer, form.dont_shoot]);
  const hasContactError = Object.values(contactErrors).some(Boolean);

  const { open, requestLeave, keepEditing, leave } = useLeaveGuard(dirty);

  useEffect(() => {
    if (!guardRef) return undefined;
    guardRef.current = { requestLeave };
    return () => { guardRef.current = null; };
  }, [guardRef, requestLeave]);

  const saveProfile = useMutation({
    mutationFn: async (next) => {
      const response = await base44.functions.invoke('updateCreatorProfile', next);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      setServerError(null);
      setSavedSnapshot(JSON.stringify(variables));
      queryClient.invalidateQueries({ queryKey: ['my-lensman-profile'] });
    },
    onError: (error) => {
      const data = error?.response?.data || {};
      setServerError({
        message: data.error || 'We could not save your profile. Please try again.',
        field: data.field || '',
      });
    },
  });

  const addToPortfolio = (urls) => update('portfolio_images', [...(form.portfolio_images || []), ...urls]);

  const uploadPortfolio = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    setUploading(true);
    setUploadError('');
    const urls = [];
    const nextWarnings = { ...warnings };
    for (const file of files) {
      const problem = fileProblem(file);
      if (problem) { setUploadError(problem); continue; }
      try {
        const size = await readImageSize(file);
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        urls.push(file_url);
        const warning = softSizeWarning(size);
        if (warning) nextWarnings[file_url] = warning;
      } catch {
        setUploadError('That image could not be uploaded.');
      }
    }
    setWarnings(nextWarnings);
    if (urls.length) addToPortfolio(urls);
    setUploading(false);
  };

  const uploadCover = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const problem = fileProblem(file);
    if (problem) { setCoverError(problem); return; }
    setUploading(true);
    setCoverError('');
    try {
      const size = await readImageSize(file);
      const tooSmall = coverSizeError(size);
      if (tooSmall) { setCoverError(tooSmall); return; }
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      addToPortfolio([file_url]);
      updateMany({ cover_image: file_url });
    } catch {
      setCoverError('That image could not be uploaded.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    const url = form.portfolio_images[index];
    update('portfolio_images', form.portfolio_images.filter((_, i) => i !== index));
    setWarnings((prev) => {
      const next = { ...prev };
      delete next[url];
      return next;
    });
    if (form.cover_image === url) updateMany({ cover_image: '' });
  };

  const pinToFront = (index) => {
    const next = Array.from(form.portfolio_images);
    const [moved] = next.splice(index, 1);
    next.unshift(moved);
    update('portfolio_images', next);
  };

  if (isLoading) {
    return <div className="p-8 border border-white/10 text-white/40 font-body text-[13px]">Loading your profile…</div>;
  }

  if (!lensman) {
    return (
      <div className="p-10 border border-white/10 text-center" style={{ background: 'hsl(var(--surface))', borderRadius: 4 }}>
        <h2 className="font-heading text-3xl text-white mb-3">No creator profile yet.</h2>
        <p className="font-body text-[13px] text-white/45 mb-6">Apply first, then your editable Stelli profile appears here.</p>
        <Link to="/apply" className="inline-flex px-6 py-3 label-mono text-[10px] font-semibold" style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}>
          Apply to join
        </Link>
      </div>
    );
  }

  const showLegacyNote = hasLegacyTags(lensman) && !noteDismissed;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
      <div className="space-y-6">
        {showLegacyNote && (
          <div className="flex items-start justify-between gap-4 border px-5 py-4" style={{ borderColor: 'hsl(var(--neon-cyan))', borderRadius: 4 }}>
            <p className="font-body text-[12px] leading-relaxed text-white/60">
              Tags were updated — pick up to three from the new list.
            </p>
            <button
              onClick={() => { localStorage.setItem(noteKey, '1'); setNoteDismissed(true); }}
              className="label-mono text-[9px] text-white/40 hover:text-white/70 shrink-0"
            >
              Got it
            </button>
          </div>
        )}

        <section className="border p-6" style={{ background: 'hsl(var(--surface))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="label-mono text-[9px] text-white/30 mb-2">Public profile</p>
              <h2 className="font-heading text-3xl font-semibold text-white">Customize your Stelli link</h2>
            </div>
            <Link to={`/creators/${lensman.id}`} className="hidden sm:inline-flex items-center gap-2 label-mono text-[9px] text-white/40 hover:text-neon-lime">
              Preview <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <ProfileIdentityFields
            form={form}
            onChange={updateMany}
            uploading={uploading}
            onImageUpload={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setUploading(true);
              try {
                const { file_url } = await base44.integrations.Core.UploadFile({ file });
                update('profile_image', file_url);
              } finally {
                setUploading(false);
              }
            }}
          />
        </section>

        <section className="border p-6 space-y-6" style={{ background: 'hsl(var(--surface))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>
          <h3 className="font-heading text-2xl font-semibold text-white">Your work</h3>

          <CoverPicker
            images={form.portfolio_images}
            cover={form.cover_image}
            focal={form.cover_focal_point}
            onPick={(url) => { setCoverError(''); updateMany({ cover_image: url }); }}
            onFocal={(point) => update('cover_focal_point', point)}
            onUpload={uploadCover}
            uploading={uploading}
            externalError={coverError}
          />

          <PortfolioOrder
            images={form.portfolio_images}
            warnings={warnings}
            onReorder={(next) => update('portfolio_images', next)}
            onPin={pinToFront}
            onRemove={removeImage}
            onUpload={uploadPortfolio}
            uploading={uploading}
          />

          {uploadError && (
            <p className="font-body text-[11px]" style={{ color: 'hsl(var(--neon-magenta))' }}>{uploadError}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <PresetPicker
              label="Theme"
              value={form.profile_theme}
              options={THEMES}
              onChange={(value) => update('profile_theme', value)}
            />
            <PresetPicker
              label="Gallery arrangement"
              value={form.gallery_style}
              options={GALLERY_STYLES}
              onChange={(value) => update('gallery_style', value)}
            />
          </div>
        </section>

        <section className="border p-6 space-y-6" style={{ background: 'hsl(var(--surface))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>
          <h3 className="font-heading text-2xl font-semibold text-white">Your voice</h3>

          <LimitedTextField
            label="One-liner"
            value={form.one_liner}
            limit={LIMITS.one_liner}
            placeholder="Flash, sweat, 2am"
            onChange={(value) => update('one_liner', value)}
            error={contactErrors.one_liner || (serverError?.field === 'one_liner' ? serverError.message : '')}
            hint="Shows in Fraunces right under your name."
          />

          <TagPicker market={market} tags={form.style_tags} onChange={(tags) => update('style_tags', tags)} />

          <PromptPicker
            question={form.prompt_question}
            answer={form.prompt_answer}
            onChange={updateMany}
            error={contactErrors.prompt_answer || (serverError?.field === 'prompt_answer' ? serverError.message : '')}
          />

          <LimitedTextField
            label="What I don't shoot"
            value={form.dont_shoot}
            limit={LIMITS.dont_shoot}
            multiline
            rows={2}
            placeholder="No weddings. No babies. Ask me about your dog though."
            onChange={(value) => update('dont_shoot', value)}
            error={contactErrors.dont_shoot || (serverError?.field === 'dont_shoot' ? serverError.message : '')}
          />

          <AccentPicker value={form.accent_color} onChange={(value) => update('accent_color', value)} />
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 h-fit space-y-4">
        <p className="label-mono text-[9px] text-white/30">Live preview</p>
        <EditorPreview form={form} fallbackName={lensman.full_name} />

        <button
          onClick={() => saveProfile.mutate(payload)}
          disabled={saveProfile.isPending || uploading || hasContactError || !dirty}
          className="w-full flex items-center justify-center gap-2 py-3.5 label-mono text-[10px] font-semibold disabled:opacity-50"
          style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}
        >
          {saveProfile.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : dirty ? <Save className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
          {dirty ? 'Save changes' : 'Saved'}
        </button>

        {serverError && !serverError.field && (
          <p className="font-body text-[11px] leading-relaxed" style={{ color: 'hsl(var(--neon-magenta))' }}>
            {serverError.message}
          </p>
        )}
      </aside>

      <UnsavedChangesDialog open={open} onKeepEditing={keepEditing} onLeave={leave} />
    </div>
  );
}