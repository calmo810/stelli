import React from 'react';
import { base44 } from '@/api/base44Client';
import { Upload } from 'lucide-react';
import { LIMITS, THEMES, GALLERY_STYLES, SPECIALTIES, spotsForMarket, spotsLabel, tagsForMarket, displayNameOf } from '@/lib/profilePresets';
import { useMarket } from '@/lib/market';
import LimitedTextField from './editor/LimitedTextField';
import PresetPicker from './editor/PresetPicker';
import CoverPicker from './editor/CoverPicker';
import PortfolioOrder from './editor/PortfolioOrder';
import TagPicker from './editor/TagPicker';
import PromptPicker from './editor/PromptPicker';
import AccentPicker from './editor/AccentPicker';
import ChipPicker from './editor/ChipPicker';
import ProfileChecklist from './editor/ProfileChecklist';
import ProfileLinkField from './editor/ProfileLinkField';
import PrivateFields from './editor/PrivateFields';

const CARD = { background: 'hsl(var(--surface))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 4 };
const fieldClass =
  'w-full border border-white/10 bg-white/[0.03] px-4 py-3 font-body text-[14px] text-white outline-none transition-colors placeholder:text-white/25 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan';

function Section({ id, title, blurb, children }) {
  return (
    <section id={id} className="border p-6 space-y-6" style={CARD}>
      <div>
        <h3 className="font-heading text-2xl font-semibold text-white mb-2">{title}</h3>
        {blurb && <p className="font-body text-[12px] text-white/50">{blurb}</p>}
      </div>
      {children}
    </section>
  );
}

/**
 * The five sections of the creator profile. State, saving and the bottom bar
 * live on the Edit Profile page — this is the form itself.
 */
export default function ProfileEditor({ controller }) {
  const { market } = useMarket();
  const {
    form, update, updateMany, checklist, contactErrors, serverError,
    warnings, coverError, uploadError, uploading,
    uploadPortfolio, uploadProfileImage, uploadCover, removeImage, pinToFront,
    lensman,
  } = controller;

  const market_ = form.market === 'NYC' ? 'NYC' : 'ELON';

  // Switching market swaps the chip list and clears picks made for the other.
  const switchMarket = (next) => {
    if (next === market_) return;
    updateMany({ market: next, neighborhoods: [] });
  };

  return (
    <div className="space-y-6">
      <ProfileChecklist items={checklist} pending={lensman?.status === 'pending'} />

      <Section id="you" title="You">
        <div id="profile_image">
          <span className="block label-mono text-[10px] text-white/40 mb-2.5">Profile photo</span>
          <div className="flex items-center gap-5">
            {form.profile_image ? (
              <img src={form.profile_image} alt="" className="w-20 h-20 object-cover" style={{ borderRadius: 999 }} />
            ) : (
              <div className="w-20 h-20" style={{ borderRadius: 999, background: 'rgba(255,255,255,0.06)' }} />
            )}
            <label className="inline-flex items-center gap-2 px-4 py-2.5 label-mono text-[10px] border cursor-pointer text-white/70 hover:text-white transition-colors" style={{ borderColor: 'rgba(255,255,255,0.15)', borderRadius: 4 }}>
              <Upload className="w-3.5 h-3.5" />
              {uploading ? 'Uploading…' : 'Upload photo'}
              <input type="file" accept="image/*" className="hidden" onChange={uploadProfileImage} disabled={uploading} />
            </label>
          </div>
        </div>

        <div id="display_name">
          <span className="block label-mono text-[10px] text-white/40 mb-2.5">Display name</span>
          <input
            type="text"
            value={form.display_name || ''}
            onChange={(event) => update('display_name', event.target.value)}
            className={fieldClass}
            style={{ borderRadius: 4 }}
          />
          <span className="block font-body text-[11px] text-white/50 mt-2">What clients see. First name is fine.</span>
          {serverError?.field === 'display_name' && (
            <span className="block font-body text-[11px] mt-2" style={{ color: 'hsl(var(--neon-magenta))' }}>{serverError.message}</span>
          )}
        </div>

        <ProfileLinkField
          slug={form.slug}
          displayName={form.display_name}
          onChange={(value) => update('slug', value)}
        />

        <LimitedTextField
          label="One-liner"
          value={form.one_liner}
          limit={LIMITS.one_liner}
          placeholder="Flash, sweat, 2am"
          onChange={(value) => update('one_liner', value)}
          error={contactErrors.one_liner || (serverError?.field === 'one_liner' ? serverError.message : '')}
          hint="The first thing clients read. One sentence."
        />
      </Section>

      <Section id="work" title="Your Work">
        <div id="market">
          <span className="block label-mono text-[10px] text-white/40 mb-2.5">Market</span>
          <div className="flex gap-2">
            {[
              { id: 'ELON', label: 'Elon' },
              { id: 'NYC', label: 'NYC' },
            ].map((option) => {
              const active = market_ === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => switchMarket(option.id)}
                  aria-pressed={active}
                  className="px-4 py-2 font-body text-[12px] border transition-colors"
                  style={{
                    borderRadius: 999,
                    borderColor: active ? 'hsl(var(--neon-cyan))' : 'rgba(255,255,255,0.15)',
                    color: active ? 'hsl(var(--neon-cyan))' : 'rgba(255,255,255,0.6)',
                    background: active ? 'hsl(var(--neon-cyan) / 0.1)' : 'transparent',
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <ChipPicker
          id="neighborhoods"
          label={`Where you shoot · ${spotsLabel(market_)}`}
          hint={market_ === 'NYC' ? 'Tap the neighborhoods you shoot in.' : 'Tap the campus spots you like shooting at.'}
          options={spotsForMarket(market_)}
          values={form.neighborhoods}
          onChange={(values) => update('neighborhoods', values)}
        />

        <ChipPicker
          id="specialties"
          label="What you shoot"
          options={SPECIALTIES}
          values={form.specialties}
          onChange={(values) => update('specialties', values)}
        />

        <div className="pt-2">
          <CoverPicker
            images={form.portfolio_images}
            cover={form.cover_image}
            focal={form.cover_focal_point}
            onPick={(url) => {
              updateMany({ cover_image: url });
            }}
            onFocal={(point) => update('cover_focal_point', point)}
            onUpload={uploadCover}
            uploading={uploading}
            externalError={coverError}
          />
        </div>

        <div id="portfolio">
          <PortfolioOrder
            images={form.portfolio_images}
            warnings={warnings}
            onReorder={(next) => update('portfolio_images', next)}
            onPin={pinToFront}
            onRemove={removeImage}
            onUpload={uploadPortfolio}
            uploading={uploading}
          />
          <span className="block font-body text-[11px] text-white/50 mt-3">
            Your first 3 photos show up top. Drag to reorder.
          </span>
        </div>

        {uploadError && (
          <p className="font-body text-[11px]" style={{ color: 'hsl(var(--neon-magenta))' }}>{uploadError}</p>
        )}

        <TagPicker market={market} tags={form.style_tags} onChange={(tags) => update('style_tags', tags)} />
      </Section>

      <Section id="how" title="How You Shoot">
        <LimitedTextField
          label="Bio"
          value={form.bio}
          limit={LIMITS.bio}
          multiline
          rows={4}
          placeholder="I shoot mostly at night, on film, and I keep it relaxed."
          onChange={(value) => update('bio', value)}
          error={contactErrors.bio || (serverError?.field === 'bio' ? serverError.message : '')}
          hint="How you shoot and what it's like to work with you."
        />

        <div id="equipment">
          <span className="block label-mono text-[10px] text-white/40 mb-2.5">Equipment</span>
          <input
            type="text"
            value={form.equipment || ''}
            onChange={(event) => update('equipment', event.target.value)}
            placeholder="Sony A7IV, 35mm, one flash"
            className={fieldClass}
            style={{ borderRadius: 4 }}
          />
          <span className="block font-body text-[11px] text-white/50 mt-2">Camera, lenses, lighting. Keep it short.</span>
        </div>

        <div id="years_experience">
          <span className="block label-mono text-[10px] text-white/40 mb-2.5">Years shooting</span>
          <input
            type="number"
            min="0"
            value={form.years_experience}
            onChange={(event) => update('years_experience', event.target.value)}
            className={fieldClass}
            style={{ borderRadius: 4 }}
          />
        </div>

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
      </Section>

      <Section id="look" title="The Look">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <AccentPicker value={form.accent_color} onChange={(value) => update('accent_color', value)} />
      </Section>

      <PrivateFields form={form} onChange={updateMany} errors={serverError ? { [serverError.field]: serverError.message } : {}} />

      {serverError && !serverError.field && (
        <p className="font-body text-[12px]" style={{ color: 'hsl(var(--neon-magenta))' }}>{serverError.message}</p>
      )}
    </div>
  );
}