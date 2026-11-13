import React from 'react';
import { EmptyState, Sheet } from '@/components/system';

/** A whole-screen empty state on a sheet of paper: an icon, a sentence, one way forward. */
export default function EmptyPanel({ icon, title, body, cta }) {
  return (
    <Sheet className="st-aurora st-aurora--sky">
      <EmptyState icon={icon} title={title} body={body} action={cta} className="min-h-[300px]" />
    </Sheet>
  );
}
