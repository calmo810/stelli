import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      <div className="max-w-[1400px] mx-auto px-8 md:px-14 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
          <div className="md:col-span-1">
            <p className="font-display text-[22px] font-semibold text-white mb-3">Stelli</p>
            <p className="text-[11px] font-body leading-relaxed" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Some moments only happen once.
            </p>
          </div>
          <div>
            <p className="text-[8px] font-body tracking-[0.4em] uppercase mb-5" style={{ color: 'rgba(255,255,255,0.15)' }}>For clients</p>
            <div className="space-y-3">
              <Link to="/browse" className="block text-[12px] font-body transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>The Collective</Link>
              <Link to="/how-it-works" className="block text-[12px] font-body transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>How it works</Link>
              <Link to="/content-day" className="block text-[12px] font-body transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>Content Day</Link>
            </div>
          </div>
          <div>
            <p className="text-[8px] font-body tracking-[0.4em] uppercase mb-5" style={{ color: 'rgba(255,255,255,0.15)' }}>For creators</p>
            <div className="space-y-3">
              <Link to="/apply" className="block text-[12px] font-body transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>Join the collective</Link>
              <Link to="/for-creators" className="block text-[12px] font-body transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>Why Stelli</Link>
              <Link to="/lensman-dashboard" className="block text-[12px] font-body transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>Creator dashboard</Link>
            </div>
          </div>
          <div>
            <p className="text-[8px] font-body tracking-[0.4em] uppercase mb-5" style={{ color: 'rgba(255,255,255,0.15)' }}>Company</p>
            <div className="space-y-3">
              <a href="mailto:hello@getstelli.com" className="block text-[12px] font-body transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>hello@getstelli.com</a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t flex flex-col md:flex-row items-start md:items-center justify-between gap-4" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <p className="text-[9px] font-body" style={{ color: 'rgba(255,255,255,0.12)' }}>
            © {new Date().getFullYear()} Stelli · NYC · All rights reserved
          </p>
          <p className="text-[9px] font-body italic font-display" style={{ color: 'rgba(242,220,169,0.25)' }}>
            一期一会 — one time, one meeting
          </p>
        </div>
      </div>
    </footer>
  );
}