import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#F5F4EF]/95 backdrop-blur-sm border-b border-[#1a2a6c]/10">
      <div className="max-w-[1300px] mx-auto px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="select-none flex items-center">
          <img
            src="https://media.base44.com/images/public/6a2c4e448e7fec52fb6d322a/b178af09a_Screenshot2026-06-14at105757PM.png"
            alt="Stelli"
            className="h-9 w-auto object-contain"
          />
        </Link>

        {/* Desktop Center Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/browse" className="text-[13px] font-body text-[#444] hover:text-[#1a2a6c] transition-colors">Book a shoot</Link>
          <Link to="/for-creators" className="text-[13px] font-body text-[#444] hover:text-[#1a2a6c] transition-colors">The Collective</Link>
          <Link to="/how-it-works" className="text-[13px] font-body text-[#444] hover:text-[#1a2a6c] transition-colors">How it works</Link>
          <Link to="/content-day" className="text-[13px] font-body text-[#444] hover:text-[#1a2a6c] transition-colors">Content Day</Link>
        </div>

        {/* Desktop Right */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/apply" className="text-[13px] font-body font-semibold text-[#1a2a6c] border border-[#1a2a6c] rounded-full px-4 py-1.5 hover:bg-[#1a2a6c] hover:text-white transition-all">
            Become a creator
          </Link>
          <button
            className="w-9 h-9 rounded-full bg-[#1a2a6c] flex items-center justify-center hover:bg-[#22337a] transition-colors"
            onClick={() => setOpen(!open)}
          >
            <Menu className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5 text-[#1a2a6c]" /> : <Menu className="w-5 h-5 text-[#1a2a6c]" />}
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
              <Link to="/browse" onClick={() => setOpen(false)} className="block text-sm font-body py-2 text-[#333]">Book a shoot</Link>
              <Link to="/for-creators" onClick={() => setOpen(false)} className="block text-sm font-body py-2 text-[#333]">The Collective</Link>
              <Link to="/how-it-works" onClick={() => setOpen(false)} className="block text-sm font-body py-2 text-[#333]">How it works</Link>
              <div className="pt-3 border-t border-gray-100">
                <Link to="/apply" onClick={() => setOpen(false)} className="block text-sm font-semibold font-body py-2 text-[#1a2a6c]">Become a creator</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}