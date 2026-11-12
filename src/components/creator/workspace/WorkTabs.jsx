import React from 'react';
import { NavLink } from 'react-router-dom';
import { preloadCreatorPane } from '@/lib/preloadCreatorWorkspace';

const SECTIONS = [
  { to: '/lensman-dashboard/requests', label: 'Requests', counted: true },
  { to: '/lensman-dashboard/bookings', label: 'Shoots' },
  { to: '/lensman-dashboard/earnings', label: 'Money' },
];

/** The three rooms inside Work: what came in, what is booked, what it pays. */
export default function WorkTabs({ requests = 0 }) {
  return (
    <div className="wk-seg wk-seg--full">
      {SECTIONS.map(({ to, label, counted }) => (
        <NavLink
          key={to}
          to={to}
          onMouseEnter={() => preloadCreatorPane('work')}
          onFocus={() => preloadCreatorPane('work')}
          onTouchStart={() => preloadCreatorPane('work')}
          className={({ isActive }) => `wk-seg-btn ${isActive ? 'is-on' : ''}`}
        >
          {label}
          {counted && requests > 0 && <span className="wk-seg-n">{requests}</span>}
        </NavLink>
      ))}
    </div>
  );
}