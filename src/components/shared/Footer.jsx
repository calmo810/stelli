import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-gold fill-gold" />
              <span className="font-display text-xl font-semibold">Stelli</span>
            </div>
            <p className="text-sm text-background/60 leading-relaxed">
              One time, one moment, perfectly captured. Connecting vetted creators with the moments that matter.
            </p>
          </div>

          {/* For Clients */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-background/40 mb-4">For Clients</h4>
            <div className="space-y-3">
              <Link to="/browse" className="block text-sm text-background/70 hover:text-background transition-colors">Browse Lensmen</Link>
              <Link to="/how-it-works" className="block text-sm text-background/70 hover:text-background transition-colors">How It Works</Link>
              <Link to="/browse" className="block text-sm text-background/70 hover:text-background transition-colors">Book a Creator</Link>
            </div>
          </div>

          {/* For Creators */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-background/40 mb-4">For Creators</h4>
            <div className="space-y-3">
              <Link to="/apply" className="block text-sm text-background/70 hover:text-background transition-colors">Join Stelli</Link>
              <Link to="/for-creators" className="block text-sm text-background/70 hover:text-background transition-colors">Why Stelli</Link>
              <Link to="/lensman-dashboard" className="block text-sm text-background/70 hover:text-background transition-colors">Creator Dashboard</Link>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-background/40 mb-4">Company</h4>
            <div className="space-y-3">
              <Link to="/how-it-works" className="block text-sm text-background/70 hover:text-background transition-colors">About</Link>
              <a href="mailto:hello@getstelli.com" className="block text-sm text-background/70 hover:text-background transition-colors">Contact</a>
              <Link to="/how-it-works" className="block text-sm text-background/70 hover:text-background transition-colors">FAQ</Link>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-background/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-background/40">© {new Date().getFullYear()} Stelli. All rights reserved.</p>
          <p className="text-xs text-background/40 italic font-display">一期一会 — ichigo ichie</p>
        </div>
      </div>
    </footer>
  );
}