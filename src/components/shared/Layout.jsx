import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import BackButton from './BackButton';
import Footer from './Footer';
import PageTransition from './PageTransition';
import LegalUpdateBanner from '@/components/legal/LegalUpdateBanner';
import RoleGate from '@/components/RoleGate';
import MobileTabBar from './MobileTabBar';

// Screens that are a tab root rather than a step down from somewhere: they own
// their place in the flow, so no back button rides above them.
const ROOT_TABS = ['/', '/creators', '/portal', '/client-dashboard', '/lensman-dashboard'];

export default function Layout() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isRootTab = ROOT_TABS.includes(location.pathname.replace(/\/$/, '') || '/');
  // A creator profile carries its own back button, up on the cover photo.
  const isCreatorProfile = /^\/creators\/[^/]+$/.test(location.pathname);
  // Messages is a full-height chat screen: it brings its own back arrow and needs no footer.
  const isMessages = /^\/(portal\/)?messages(\/[^/]+)?$/.test(location.pathname);
  // The creator workspace is an app screen: its own tabs, its own way back.
  const isWorkspace = location.pathname.startsWith('/lensman-dashboard');
  // Switching conversations doesn't remount the messages screen.
  const transitionKey = isMessages ? '/messages' : location.pathname;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground tabbar-gap">
      <Navbar />
      {/* The way back rides in the page's own flow, never pinned to the screen. */}
      <main className={`flex-1 ${isHome ? '' : 'nav-offset'}`}>
        {!isHome && !isRootTab && !isCreatorProfile && !isMessages && !isWorkspace && (
          <div className="mx-auto max-w-[1500px] px-5 pt-6 md:px-10">
            <BackButton />
          </div>
        )}
        <RoleGate>
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={transitionKey}>
              {/* Pages load on demand; the nav and footer stay put while they do. */}
              <Suspense fallback={<div className="min-h-[70vh]" />}>
                <Outlet />
              </Suspense>
            </PageTransition>
          </AnimatePresence>
        </RoleGate>
      </main>
      {!isMessages && !isWorkspace && <Footer />}
      <MobileTabBar />
      <LegalUpdateBanner />
    </div>
  );
}