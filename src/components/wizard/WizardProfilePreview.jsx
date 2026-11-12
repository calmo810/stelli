import React from 'react';
import CreatorProfile from '@/components/profile/CreatorProfile';

/**
 * The live preview: the creator's page drawn by the same component the public
 * route uses, from the form as it stands. Nothing here is a second design of
 * the profile, so it can't drift from what clients see.
 */
export default function WizardProfilePreview({ profile }) {
  return <CreatorProfile creator={profile} preview compact />;
}
