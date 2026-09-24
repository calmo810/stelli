import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';
import CreatorProfileView from '@/components/profile/CreatorProfileView';

const SURFACE = { background: 'hsl(var(--surface))', borderRadius: 4 };

function PrivatePanel({ lensman, note, setNote, decide }) {
  const { data: account } = useQuery({
    queryKey: ['application-account', lensman.user_id],
    enabled: !!lensman.user_id,
    queryFn: async () => {
      try {
        return await base44.entities.User.get(lensman.user_id);
      } catch {
        return null;
      }
    },
  });

  const ageLine = lensman.age_confirmed
    ? `Yes · ${lensman.age_confirmed_at ? format(new Date(lensman.age_confirmed_at), 'MMM d, yyyy') : 'date not recorded'}`
    : 'No';

  const rows = [
    ['Full name', lensman.full_name],
    ['Profile email', lensman.email],
    ['Account email', account?.email || '—'],
    ['Phone', lensman.phone],
    ['Market', lensman.market],
    ['Neighborhoods', (lensman.neighborhoods || []).join(', ')],
    ['Years of experience', lensman.years_experience],
    ['Equipment', lensman.equipment],
    ['Age confirmed', ageLine],
  ];

  return (
    <div className="max-w-[1500px] mx-auto px-5 md:px-10 pt-24 pb-10">
      <Link to="/admin/applications" className="inline-flex items-center gap-2 label-mono text-[10px] text-white/35 hover:text-neon-lime transition-colors mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> All applications
      </Link>

      <div className="border border-white/10 p-6 md:p-8" style={SURFACE}>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <p className="label-mono text-[9px] text-white/35 mb-2">Private · admins only</p>
            <h2 className="font-heading text-[26px] font-semibold text-white leading-tight">{lensman.full_name}</h2>
          </div>
          <span
            className="label-mono text-[8px] font-semibold px-2.5 py-1.5"
            style={{ background: 'hsl(var(--neon-cyan) / 0.12)', color: 'hsl(var(--neon-cyan))', borderRadius: 3 }}
          >
            {lensman.status}
          </span>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 mb-7">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="label-mono text-[8px] text-white/30 mb-1.5">{label}</dt>
              <dd className="font-body text-[13px] text-white/75 break-words">
                {value === undefined || value === null || value === '' ? '—' : String(value)}
              </dd>
            </div>
          ))}
        </dl>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional) — kept with the application."
          className="w-full bg-transparent border border-white/10 text-white text-sm min-h-[70px] p-3 mb-5 placeholder:text-white/25 outline-none focus:border-white/30"
          style={{ borderRadius: 4 }}
        />

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => decide.mutate('approve')}
            disabled={decide.isPending}
            className="inline-flex items-center gap-2 label-mono text-[10px] font-semibold px-6 py-3.5 disabled:opacity-50"
            style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}
          >
            {decide.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Approve
          </button>
          <button
            onClick={() => decide.mutate('reject')}
            disabled={decide.isPending}
            className="inline-flex items-center gap-2 label-mono text-[10px] px-6 py-3.5 border border-white/15 text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-50"
            style={{ borderRadius: 4 }}
          >
            <X className="w-3.5 h-3.5" /> Reject
          </button>
        </div>

        {decide.isError && (
          <p className="font-body text-[12px] mt-4" style={{ color: 'hsl(var(--neon-magenta))' }}>
            {decide.error?.response?.data?.error || 'That did not save. Try again.'}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * The applicant's profile exactly as a client would see it, with the private
 * review panel pinned above it.
 */
export default function AdminApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');

  const { data: lensman } = useQuery({
    queryKey: ['application', id],
    enabled: !!id,
    queryFn: async () => {
      const list = await base44.entities.Lensman.filter({ id });
      return list[0] || null;
    },
  });

  const decide = useMutation({
    mutationFn: (action) =>
      base44.functions.invoke('reviewCreatorApplication', { lensmanId: id, action, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-applications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-lensmen'] });
      navigate('/admin/applications');
    },
  });

  return (
    <CreatorProfileView
      creatorId={id}
      adminPanel={
        lensman ? <PrivatePanel lensman={lensman} note={note} setNote={setNote} decide={decide} /> : null
      }
    />
  );
}