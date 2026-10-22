import React from 'react';
import LegalPage from '@/components/legal/LegalPage';
import { PRIVACY_CONTENT, PRIVACY_LAST_UPDATED } from '@/lib/legalDocuments';

export default function Privacy() {
  return <LegalPage title="Privacy Policy" type="Privacy" content={PRIVACY_CONTENT} lastUpdated={PRIVACY_LAST_UPDATED} />;
}