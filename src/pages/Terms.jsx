import React from 'react';
import LegalPage from '@/components/legal/LegalPage';
import { TERMS_CONTENT, TERMS_LAST_UPDATED } from '@/lib/legalDocuments';

export default function Terms() {
  return <LegalPage title="Terms and Conditions" type="Terms" content={TERMS_CONTENT} lastUpdated={TERMS_LAST_UPDATED} />;
}