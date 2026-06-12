import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isHome ? 'bg-background/80 backdrop-blur-md' : 'bg-background border-b border-border'}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Star className="w-5 h-5 text-gold fill-gold" />
          <span className="font-display text-xl font-semibold tracking-tight text-foreground">Stelli</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/browse" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Browse Lensmen</Link>
          <Link to="/how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How It Works</Link>
          <Link to="/for-creators" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">For Creators</Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/apply">
            <Button variant="ghost" size="sm" className="text-sm">Join as Creator</Button>
          </Link>
          <Link to="/browse">
            <Button size="sm" className="text-sm bg-foreground text-background hover:bg-foreground/90">Book a Creator</Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border overflow-hidden"
          >
            <div className="px-6 py-4 space-y-3">
              <Link to="/browse" onClick={() => setOpen(false)} className="block text-sm font-medium py-2">Browse Lensmen</Link>
              <Link to="/how-it-works" onClick={() => setOpen(false)} className="block text-sm font-medium py-2">How It Works</Link>
              <Link to="/for-creators" onClick={() => setOpen(false)} className="block text-sm font-medium py-2">For Creators</Link>
              <div className="pt-3 border-t border-border space-y-2">
                <Link to="/apply" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full text-sm">Join as Creator</Button>
                </Link>
                <Link to="/browse" onClick={() => setOpen(false)}>
                  <Button className="w-full text-sm bg-foreground text-background">Book a Creator</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}