import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#F5F4EF]/95 backdrop-blur-sm border-b border-[#1a2a6c]/8">
      <div className="max-w-[1400px] mx-auto px-8 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="select-none flex items-center gap-1">
          <span style={{ fontFamily: "'Pacifico', cursive" }} className="text-2xl text-[#1a2a6c] leading-none">Stelli</span>
          <span className="text-[#1a2a6c] text-lg leading-none" style={{ fontFamily: "'Pacifico', cursive" }}>✦</span>
        </Link>

        {/* Desktop Center Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/browse" className="text-sm font-body text-[#333] hover:text-[#1a1a1a] transition-colors">Book a shoot</Link>
          <Link to="/for-creators" className="text-sm font-body text-[#333] hover:text-[#1a1a1a] transition-colors">The Collective</Link>
          <Link to="/how-it-works" className="text-sm font-body text-[#333] hover:text-[#1a1a1a] transition-colors">The Studio</Link>
          <Link to="/for-creators" className="text-sm font-body text-[#333] hover:text-[#1a1a1a] transition-colors">For business</Link>
        </div>

        {/* Desktop Right */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/apply" className="text-sm font-semibold font-body text-[#1a1a1a] hover:opacity-70 transition-opacity">
            Become a creator
          </Link>
          <button
            className="w-9 h-9 rounded-full bg-[#1a1a1a] flex items-center justify-center hover:bg-[#333] transition-colors"
            onClick={() => setOpen(!open)}
          >
            <Menu className="w-4 h-4 text-white" />
          </button>
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
            className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="px-8 py-4 space-y-3">
              <Link to="/browse" onClick={() => setOpen(false)} className="block text-sm font-medium py-2">Book a shoot</Link>
              <Link to="/for-creators" onClick={() => setOpen(false)} className="block text-sm font-medium py-2">The Collective</Link>
              <Link to="/how-it-works" onClick={() => setOpen(false)} className="block text-sm font-medium py-2">The Studio</Link>
              <Link to="/for-creators" onClick={() => setOpen(false)} className="block text-sm font-medium py-2">For business</Link>
              <div className="pt-3 border-t border-gray-100">
                <Link to="/apply" onClick={() => setOpen(false)} className="block text-sm font-semibold py-2">Become a creator</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}