import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, X } from 'lucide-react';
import ProfileEditor from '@/components/dashboard/ProfileEditor';
import EditorPreview from '@/components/dashboard/editor/EditorPreview';
import UnsavedChangesDialog from '@/components/dashboard/editor/UnsavedChangesDialog';
import useProfileForm from '@/hooks/useProfileForm';
import useLeaveGuard from '@/hooks/useLeaveGuard';
import { displayNameOf } from '@/lib/profilePresets';

const CYAN = 'hsl(var(--neon-cyan))';

export default function EditProfile() {
  const controller = useProfileForm();
  const { form, lensman, isLoading, dirty, save, discard, savedFlash, saveProfile, hasContactError, uploading } = controller;
  const [previewOpen, setPreviewOpen] = useState(false);

  const { open, requestLeave, keepEditing, leave } = useLeaveGuard(dirty);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/15 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Only a signed-in creator gets in. Everyone else goes home.
  if (!lensman) return <Navigate to="/" replace />;

  const previewHref = `/creators/${lensman.slug || lensman.id}`;
  const canSave = dirty && !hasContactError && !uploading && !saveProfile.isPending;

  return (
    <div className="min-h-screen bg-ink pb-32">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 pt-10">
        <Link
          to="/lensman-dashboard"
          onClick={(event) => {
            if (!dirty) return;
            event.preventDefault();
            requestLeave(() => {
              window.location.assign('/lensman-dashboard');
            });
          }}
          className="inline-flex items-center gap-2 label-mono text-[10px] text-white/40 hover:text-neon-cyan transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard.
        </Link>

        <div className="mt-8 mb-8">
          <h1 className="font-heading text-white font-semibold leading-[0.95] mb-3" style={{ fontSize: 'clamp(32px, 4.5vw, 56px)' }}>
            Your profile
          </h1>
          <div className="flex flex-wrap items-center gap-5">
            <a
              href={previewHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 label-mono text-[10px] text-white/50 hover:text-neon-cyan transition-colors"
            >
              Preview my profile. <ExternalLink className="w-3 h-3" />
            </a>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="lg:hidden label-mono text-[10px] text-white/50 hover:text-neon-cyan"
            >
              See preview.
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 items-start">
          <ProfileEditor controller={controller} />

          <aside className="hidden lg:block lg:sticky lg:top-10 h-fit">
            <p className="label-mono text-[9px] text-white/30 mb-4">Live preview</p>
            <EditorPreview form={form} fallbackName={displayNameOf(lensman)} />
          </aside>
        </div>
      </div>

      {/* Pinned action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-ink/95 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-4 flex items-center gap-4">
          <button
            type="button"
            onClick={discard}
            disabled={!dirty}
            className="px-6 py-3.5 label-mono text-[10px] font-semibold border text-white/70 disabled:opacity-40"
            style={{ borderColor: 'rgba(255,255,255,0.15)', borderRadius: 4 }}
          >
            Discard
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!canSave}
            className="flex-1 px-8 py-3.5 label-mono text-[10px] font-semibold disabled:opacity-40"
            style={{ background: CYAN, color: '#0a0f1e', borderRadius: 4 }}
          >
            {savedFlash ? 'Saved.' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Full screen preview on mobile */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-ink overflow-y-auto lg:hidden">
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-ink/95 backdrop-blur border-b border-white/10">
            <p className="label-mono text-[9px] text-white/40">Live preview</p>
            <button type="button" onClick={() => setPreviewOpen(false)} className="text-white/60 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-5 py-6">
            <EditorPreview form={form} fallbackName={displayNameOf(lensman)} />
          </div>
        </div>
      )}

      <UnsavedChangesDialog open={open} onKeepEditing={keepEditing} onLeave={leave} />
    </div>
  );
}