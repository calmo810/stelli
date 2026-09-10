import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { LEGAL_VERSION } from '@/lib/legalDocuments';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

export default function LegalUpdateBanner() {
  const [needed, setNeeded] = useState([]);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let active = true;
    async function load() {
      const authenticated = await base44.auth.isAuthenticated();
      if (!authenticated) return;
      const acceptances = await base44.entities.AgreementAcceptance.list('-accepted_at');
      const missing = ['terms', 'privacy'].filter(type => !acceptances.some(a => a.document_type === type && a.document_version === LEGAL_VERSION));
      if (active) setNeeded(missing);
    }
    load();
    return () => { active = false; };
  }, []);

  const accept = async () => {
    setSaving(true);
    await Promise.all(needed.map(documentType => base44.functions.invoke('recordAgreementAcceptance', { documentType, documentVersion: LEGAL_VERSION })));
    setNeeded([]);
    setSaving(false);
  };

  if (!needed.length || ['/terms', '/privacy'].includes(location.pathname)) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center bg-[#10182d]/78 backdrop-blur-sm px-4 py-6">
      <div className="max-w-xl w-full border p-6 md:p-8" style={{ background: '#f0ede6', borderColor: 'rgba(242,220,169,0.45)' }}>
        <p className="text-[8px] font-body tracking-[0.42em] uppercase mb-4" style={{ color: 'rgba(26,39,68,0.4)' }}>Updated legal terms</p>
        <h2 className="font-display text-3xl font-semibold mb-4" style={{ color: '#1a2744' }}>We've updated our Terms.</h2>
        <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(26,39,68,0.58)' }}>Review and accept to continue using Stelli.</p>
        <label className="flex items-start gap-3 mb-6 cursor-pointer">
          <Checkbox checked={checked} onCheckedChange={setChecked} className="mt-1" />
          <span className="text-sm leading-relaxed" style={{ color: 'rgba(26,39,68,0.7)' }}>
            I agree to Stelli's <Link to="/terms" className="underline">Terms and Conditions</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.
          </span>
        </label>
        <Button onClick={accept} disabled={!checked || saving} className="w-full rounded-full bg-[#1a2744] text-[#f0ede6]">Accept and continue</Button>
      </div>
    </div>
  );
}