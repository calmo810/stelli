import React from 'react';
import { useParams } from 'react-router-dom';
import CreatorProfileView from '@/components/profile/CreatorProfileView';

export default function CreatorProfile() {
  const { id } = useParams();
  return <CreatorProfileView creatorId={id} />;
}