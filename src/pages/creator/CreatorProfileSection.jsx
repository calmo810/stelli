import React, { useState } from 'react';
import { Link, Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { SECTIONS, formFromProfile, readFailure } from '@/lib/creatorProfile';
import { SECTION_BODIES } from '@/components/creator/form';
import useProfileForm from '@/hooks/useProfileForm';

const PROFILE = '/lensman-dashboard/profile';

/**
 * One part of a creator's page, edited inside the portal: open it from the
 * Profile tab, change it, Save, and you are back on the Profile tab. Only that
 * part is sent, so saving a bio can never disturb the photos.
 *
 * It is the same form the application uses — the application just shows four
 * of these sections in a row.
 */
export default function CreatorProfileSection() {
  const { section: key } = useParams();
  const { myProfile, myContact, user, refetchProfile } = useOutletContext();
  const navigate = useNavigate();
  const { form, set, uploads } = useProfileForm(formFromProfile(myProfile, myContact, user));
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState('');

  const section = SECTIONS[key];
  const Body = SECTION_BODIES[key];
  if (!section || !Body) return <Navigate to={PROFILE} replace />;

  const save = async (event) => {
    event.preventDefault();
    if (saving || uploads.uploading) return;
    const stuck = section.problem(form);
    if (stuck) {
      setProblem(stuck);
      return;
    }
    setSaving(true);
    setProblem('');
    try {
      const payload = section.payload(form);
      // A live page keeps its link when the display name changes.
      if (key === 'you' && myProfile.slug) payload.slug = myProfile.slug;
      const response = await base44.functions.invoke('updateCreatorProfile', payload);
      if (response?.data?.error) throw Object.assign(new Error(response.data.error), { data: response.data });
      await refetchProfile();
      navigate(PROFILE);
    } catch (error) {
      setProblem(readFailure(error).message);
      setSaving(false);
    }
  };

  return (
    <form className="arch-tab arch-tab--profile" onSubmit={save}>
      <Link to={PROFILE} className="cf-back">
        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.6} /> Profile
      </Link>
      <h1 className="wk-h1">{section.label}</h1>
      <p className="wk-lede">{section.lede}</p>

      <div className="wk-card wk-card--pad mt-5">
        <Body form={form} set={set} uploads={uploads} slug={myProfile.slug || ''} />
      </div>

      {problem && (
        <p className="cf-error" role="alert">
          {problem}
        </p>
      )}

      <div className="cf-actions">
        <button type="submit" className="wk-btn wk-btn--ink" disabled={saving || uploads.uploading}>
          {uploads.uploading ? uploads.note || 'Uploading…' : saving ? 'Saving…' : 'Save'}
        </button>
        <Link to={PROFILE} className="wk-btn wk-btn--ghost">
          Cancel
        </Link>
      </div>
    </form>
  );
}
