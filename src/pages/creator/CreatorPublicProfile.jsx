import React from 'react';
import { useOutletContext } from 'react-router-dom';
import '@/styles/creatorForm.css';
import PhotoReleases from '@/components/dashboard/PhotoReleases';
import ProfilePerformance from '@/components/creator/ProfilePerformance';
import StorefrontCard from '@/components/creator/profile/StorefrontCard';
import ProfileSetup from '@/components/creator/profile/ProfileSetup';
import ProfileDetails from '@/components/creator/profile/ProfileDetails';
import ChangesRequested from '@/components/creator/profile/ChangesRequested';

/**
 * The storefront: who clients meet, what still needs doing, then the numbers.
 * Every line opens just that part of the page (profile/:section) and saving
 * comes straight back here.
 */
export default function CreatorPublicProfile() {
  const { myProfile, myContact, user, refetchProfile } = useOutletContext();

  return (
    <div className="arch-tab arch-tab--profile">
      <h1 className="wk-h1">Profile</h1>
      <p className="wk-lede">What clients see before they send a date. Tap any line to change it.</p>

      {myProfile.status === 'needs_changes' && (
        <div className="mt-4">
          <ChangesRequested note={myContact?.changes_requested} onSent={refetchProfile} />
        </div>
      )}

      <div className="mt-4">
        <StorefrontCard profile={myProfile} />
      </div>

      <div className="arch-profile-grid mt-3">
        <ProfileSetup profile={myProfile} />
        <ProfileDetails profile={myProfile} contact={myContact} />
        <ProfilePerformance profile={myProfile} />
      </div>

      <div className="mt-3">
        <PhotoReleases role="lensman" user={user} light />
      </div>
    </div>
  );
}
