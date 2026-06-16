import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t" style={{ background: '#f0ede6', borderColor: 'rgba(26,39,68,0.1)' }}>
      <div className="max-w-[1400px] mx-auto px-8 md:px-14 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
          <div className="md:col-span-1">
            <p className="font-display font-semibold mb-3" style={{ fontSize: 22, color: '#1a2744' }}>Stelli</p>
            <p className="text-[11px] font-body leading-relaxed" style={{ color: 'rgba(26,39,68,0.4)' }}>
              Some moments only happen once.
            </p>
          </div>
          {[
            { label: 'For clients', links: [{ to: '/browse', text: 'The Collective' }, { to: '/how-it-works', text: 'How it works' }, { to: '/content-day', text: 'Content Day' }] },
            { label: 'For creators', links: [{ to: '/apply', text: 'Join the collective' }, { to: '/for-creators', text: 'Why Stelli' }, { to: '/lensman-dashboard', text: 'Creator dashboard' }] },
            { label: 'Company', links: [{ to: null, href: 'mailto:hello@getstelli.com', text: 'hello@getstelli.com' }] },
          ].map(col => (
            <div key={col.label}>
              <p className="text-[8px] font-body tracking-[0.4em] uppercase mb-5" style={{ color: 'rgba(26,39,68,0.25)' }}>{col.label}</p>
              <div className="space-y-3">
                {col.links.map(l => l.href ? (
                  <a key={l.text} href={l.href} className="block text-[12px] font-body transition-colors" style={{ color: 'rgba(26,39,68,0.4)' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#1a2744'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(26,39,68,0.4)'}>{l.text}</a>
                ) : (
                  <Link key={l.text} to={l.to} className="block text-[12px] font-body transition-colors" style={{ color: 'rgba(26,39,68,0.4)' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#1a2744'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(26,39,68,0.4)'}>{l.text}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          style={{ borderColor: 'rgba(26,39,68,0.08)' }}>
          <p className="text-[9px] font-body" style={{ color: 'rgba(26,39,68,0.2)' }}>
            © {new Date().getFullYear()} Stelli · NYC · All rights reserved
          </p>
          <p className="text-[9px] font-body italic font-display" style={{ color: 'rgba(26,39,68,0.3)' }}>
            一期一会 — one time, one meeting
          </p>
        </div>
      </div>
    </footer>
  );
}