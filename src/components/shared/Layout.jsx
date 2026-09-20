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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className={`flex-1 ${location.pathname === '/' ? '' : 'pt-16'}`}>
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