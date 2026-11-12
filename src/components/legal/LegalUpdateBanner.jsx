import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { PRIVACY_VERSION, TERMS_VERSION } from '@/lib/legalDocuments';
import { Checkbox } from '@/components/ui/checkbox';
import { applyPendingSignup } from '@/lib/pendingSignup';
import { fetchCurrentUser } from '@/hooks/useCurrentUser';

/** Each document's current version, so updating one doesn't re-prompt the other. */
const REQUIRED_VERSIONS = { terms: TERMS_VERSION, privacy: PRIVACY_VERSION };

export default function LegalUpdateBanner() {
  const [needed, setNeeded] = useState([]);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();

  useEffect(() => {
    let active = true;
    async function load() {
      const user = await fetchCurrentUser();
      if (!user) return;
      // Terms ticked on a sign-up form just before a trip to Google are
      // recorded first, so this never asks for what was accepted a minute ago.
      await applyPendingSignup(user);
      // If the list can't be read, nobody is locked out of the app by a
      // banner they may not even need: it is checked again on the next visit.
      const acceptances = await base44.entities.AgreementAcceptance.list('-accepted_at').catch(() => null);
      if (!acceptances) return;
      const missing = Object.entries(REQUIRED_VERSIONS)
        .filter(
          ([type, version]) =>
            !acceptances.some((a) => a.document_type === type && a.document_version === version)
        )
        .map(([type]) => type);
      if (active) setNeeded(missing);
    }
    load().catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const accept = async () => {
    setSaving(true);
    setError('');
    try {
      await Promise.all(
        needed.map((documentType) =>
          base44.functions.invoke('recordAgreementAcceptance', {
            documentType,
            documentVersion: REQUIRED_VERSIONS[documentType],
          })
        )
      );
      setNeeded([]);
    } catch {
      // It used to hang on "saving" forever when this failed.
      setError('That did not save. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!needed.length || location.pathname === '/terms') return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center bg-[#0a0f1e]/85 backdrop-blur-sm px-4 py-6">
      <div className="max-w-xl w-full border p-6 md:p-8" style={{ background: 'hsl(var(--surface))', borderColor: 'rgba(255,255,255,0.14)', borderRadius: 4 }}>
        <p className="label-mono text-[9px] text-white/40 mb-4">Updated legal terms</p>
        <h2 className="font-heading text-3xl font-semibold mb-4 text-white">
          We have new Terms and Conditions.
        </h2>
        <p className="font-body text-sm leading-relaxed mb-6 text-white/55">
          You must accept them to continue using Stelli.
        </p>
        <label className="flex items-start gap-3 mb-6 cursor-pointer">
          <Checkbox checked={checked} onCheckedChange={setChecked} className="mt-1" />
          <span className="font-body text-sm leading-relaxed text-white/70">
            I agree to Stelli's Terms and Conditions.
          </span>
        </label>
        {error && (
          <p role="alert" className="mb-4 font-body text-sm" style={{ color: 'hsl(var(--neon-magenta))' }}>
            {error}
          </p>
        )}
        <button
          onClick={accept}
          disabled={!checked || saving}
          className="w-full py-3.5 label-mono text-[10px] font-semibold disabled:opacity-40"
          style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}
        >
          Accept and continue
        </button>
      </div>
    </div>
  );
}