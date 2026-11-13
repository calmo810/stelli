import React from 'react';
import { Page } from '@/components/system';

/** One narrow column on the ink stage, for a portal's sign-in, empty and loading screens. */
export default function DashboardShell({ children }) {
  return <Page width="narrow">{children}</Page>;
}
