import React from 'react';
import { useOutletContext } from 'react-router-dom';
import PhotoReleases from '@/components/dashboard/PhotoReleases';
import ProfilePerformance from '@/components/creator/ProfilePerformance';
import StorefrontCard from '@/components/creator/profile/StorefrontCard';
import ProfileSetup from '@/components/creator/profile/ProfileSetup';
import ProfileDetails from '@/components/creator/profile/ProfileDetails';

/** The storefront: who clients meet, what still needs doing, then the numbers. */
export default function CreatorPublicProfile() {
  const { myProfile, user } = useOutletContext();

  return (
    <div className="arch-tab arch-tab--profile">
      <h1 className="wk-h1">Profile</h1>
      <p className="wk-lede">What clients see before they send a date. Tap any line to change it.</p>

      <div className="mt-4">
        <StorefrontCard profile={myProfile} />
      </div>

      <div className="arch-profile-grid mt-3">
        <ProfileSetup profile={myProfile} />
        <ProfileDetails profile={myProfile} />
        <ProfilePerformance profile={myProfile} />
      </div>

      <div className="mt-3">
        <PhotoReleases role="lensman" user={user} />
      </div>
    </div>
  );
}