import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Four little tinted tiles instead of one grey strip. Soft colour carries the
 * personality; the numbers stay black on paper.
 */
export default function StatTiles({ tiles = [] }) {
  return (
    <div className="wk-stattiles">
      {tiles.map(({ key, label, value, to, tone, icon: Icon }) => (
        <Link key={key} to={to} className={`wk-stattile wk-stattile--${tone}`}>
          <Icon className="h-[15px] w-[15px]" strokeWidth={2.2} />
          <b className="wk-stattile-v">{value}</b>
          <span className="wk-stattile-l">{label}</span>
        </Link>
      ))}
    </div>
  );
}