import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import BackButton from './BackButton';
import Footer from './Footer';
import PageTransition from './PageTransition';
import LegalUpdateBanner from '@/components/legal/LegalUpdateBanner';
import RoleGate from '@/components/RoleGate';
import { pageParent } from '@/lib/stackRoutes';

export default function Layout() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  // A creator profile carries its own back button, up on the cover photo.
  const isCreatorProfile = /^\/creators\/[^/]+$/.test(location.pathname);
  // A sheet opens over its dashboard without remounting it.
  const transitionKey = pageParent(location.pathname) || location.pathname;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      {/* The way back rides in the page's own flow, never pinned to the screen. */}
      <main className={`flex-1 ${isHome ? '' : 'pt-16'}`}>
        {!isHome && !isCreatorProfile && (
          <div className="mx-auto max-w-[1500px] px-5 pt-6 md:px-10">
            <BackButton />
          </div>
        )}
        <RoleGate>
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={transitionKey}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </RoleGate>
      </main>
      <Footer />
      <LegalUpdateBanner />
    </div>
  );
}