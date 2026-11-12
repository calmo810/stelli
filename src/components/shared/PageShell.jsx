import React from 'react';
import { Page, Sheet } from '@/components/system';

const WIDTHS = { wide: 'default', narrow: 'narrow', reading: 'reading' };

/**
 * A long-form page: one sheet of paper on the ink stage.
 * width="reading" for legal and long copy, "narrow" for forms.
 */
/** @param {Record<string, any>} props */
export default function PageShell({ width = 'wide', children, className = '' }) {
  return (
    <Page width={WIDTHS[width] || 'default'}>
      <Sheet className={className}>{children}</Sheet>
    </Page>
  );
}
