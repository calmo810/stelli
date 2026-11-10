import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import PageNotFound from '@/lib/PageNotFound';
import useNoIndex from '@/lib/useNoIndex';

/**
 * Only lets admin accounts render the wrapped page.
 *
 * Everyone else — signed out, or signed in without the admin role — gets the
 * ordinary "page not found" screen, the same one a broken link shows. No
 * redirect, no "access denied": nothing that says this address is real. The
 * admin page's code is also only downloaded once this check passes.
 *
 * This is the door, not the lock. The lock is on the server: every piece of
 * admin data is read through rules that allow admins only, and every admin
 * action runs in a backend function that checks the role itself (see
 * REVIEW.md, "Is /admin really locked?"). Someone who forced this component to
 * render would see an empty page and buttons that answer "Forbidden".
 */
export default function AdminRoute({ children }) {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) return <div className="min-h-[70vh] bg-ink" />;
  if (user?.role !== 'admin') return <PageNotFound />;
  return <AdminOnly>{children}</AdminOnly>;
}

function AdminOnly({ children }) {
  useNoIndex();
  return children;
}
