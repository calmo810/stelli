import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

/**
 * Sends an old URL to its new home, carrying any route params across.
 * e.g. <LegacyRedirect to="/creators/:id" /> for /lensman/:id
 */
export default function LegacyRedirect({ to }) {
  const params = useParams();
  const path = Object.entries(params).reduce(
    (acc, [key, value]) => acc.replace(`:${key}`, value),
    to
  );
  return <Navigate to={path} replace />;
}