import React from 'react';
import LegalPage from '@/components/legal/LegalPage';
import { LEGAL_LAST_UPDATED, TERMS_CONTENT } from '@/lib/legalDocuments';

export default function Terms() {
  return <LegalPage title="Terms and Conditions" type="Terms" content={TERMS_CONTENT} lastUpdated={LEGAL_LAST_UPDATED} />;
}