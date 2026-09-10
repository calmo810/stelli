import React from 'react';
import LegalPage from '@/components/legal/LegalPage';
import { LEGAL_LAST_UPDATED, PRIVACY_CONTENT } from '@/lib/legalDocuments';

export default function Privacy() {
  return <LegalPage title="Privacy Policy" type="Privacy" content={PRIVACY_CONTENT} lastUpdated={LEGAL_LAST_UPDATED} />;
}