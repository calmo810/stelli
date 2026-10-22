import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import BackButton from './BackButton';
import Footer from './Footer';
import PageTransition from './PageTransition';
import LegalUpdateBanner from '@/components/legal/LegalUpdateBanner';
import RoleGate from '@/components/RoleGate';

export default function Layout() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  // A creator profile carries its own back button, up on the cover photo.
  const isCreatorProfile = /^\/creators\/[^/]+$/.test(location.pathname);
  // Messages is a full-height chat screen: it brings its own back arrow and needs no footer.
  const isMessages = /^\/(portal\/)?messages(\/[^/]+)?$/.test(location.pathname);
  // Switching conversations doesn't remount the messages screen.
  const transitionKey = isMessages ? '/messages' : location.pathname;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      {/* The way back rides in the page's own flow, never pinned to the screen. */}
      <main className={`flex-1 ${isHome ? '' : 'pt-16'}`}>
        {!isHome && !isCreatorProfile && !isMessages && (
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
      {!isMessages && <Footer />}
      <LegalUpdateBanner />
    </div>
  );
}