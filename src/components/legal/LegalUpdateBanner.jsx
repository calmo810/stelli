import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { PRIVACY_VERSION, TERMS_VERSION } from '@/lib/legalDocuments';
import { applyPendingSignup } from '@/lib/pendingSignup';
import { fetchCurrentUser } from '@/hooks/useCurrentUser';
import { Btn, Check, Dialog, Note } from '@/components/system';

/** Each document's current version, so updating one doesn't re-prompt the other. */
const REQUIRED_VERSIONS = { terms: TERMS_VERSION, privacy: PRIVACY_VERSION };

/**
 * Asks a signed-in account to accept the Terms when a newer version exists
 * than the one they accepted. It can't be dismissed, but it never appears on
 * the Terms page itself, so the document can always be read first.
 */
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
    <Dialog open busy kicker="Updated legal terms" title="We have new Terms and Conditions.">
      <p className="st-body mt-3">
        Please accept them to keep using Stelli. You can{' '}
        <Link to="/terms" className="st-link">
          read them first
        </Link>
        .
      </p>

      <Check checked={checked} onChange={setChecked} className="mt-3" data-autofocus>
        I agree to Stelli's Terms and Conditions.
      </Check>

      {error && (
        <Note tone="error" className="mt-3">
          {error}
        </Note>
      )}

      <div className="st-dialog__actions">
        <Btn onClick={accept} disabled={!checked} loading={saving} block>
          Accept and continue
        </Btn>
      </div>
    </Dialog>
  );
}
