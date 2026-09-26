import React from 'react';
import { Link } from 'react-router-dom';

/** One tap into a quick sub-page, which opens as a sheet over the dashboard. */
export default function StackTile({ to, label, value, hot = false }) {
  return (
    <Link
      to={to}
      className="glass flex flex-col rounded-[22px] p-5 transition-transform duration-300 hover:-translate-y-[3px]"
    >
      <small className="text-[13px] text-white/55">{label}</small>
      <b
        className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.03em]"
        style={{ color: hot ? 'hsl(var(--neon-cyan))' : '#fff' }}
      >
        {value}
      </b>
    </Link>
  );
}