import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

/**
 * Only lets admin accounts render the wrapped page.
 * Everyone else is sent back to the homepage.
 */
export default function AdminRoute({ children }) {
  const [state, setState] = useState('checking');

  useEffect(() => {
    let active = true;
    base44.auth.me()
      .then((user) => {
        if (!active) return;
        setState(user?.role === 'admin' ? 'allowed' : 'denied');
      })
      .catch(() => {
        if (active) setState('denied');
      });
    return () => { active = false; };
  }, []);

  if (state === 'checking') return <div className="min-h-screen bg-ink" />;
  if (state === 'denied') return <Navigate to="/" replace />;
  return children;
}