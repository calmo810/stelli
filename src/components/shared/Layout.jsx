import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import PageTransition from './PageTransition';
import LegalUpdateBanner from '@/components/legal/LegalUpdateBanner';
import RoleGate from '@/components/RoleGate';

export default function Layout() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      {/* 64px bar + 52px back row: content always starts below both. */}
      <main className={`flex-1 ${isHome ? '' : 'pt-[116px]'}`}>
        <RoleGate>
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={location.pathname}>
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