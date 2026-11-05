import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search, UserRound } from 'lucide-react';

const CARD = 'border border-white/10';
const SURFACE = { background: 'hsl(var(--surface))', borderRadius: 4 };
const FIELD = 'w-full rounded border border-white/15 bg-white/[0.03] px-4 py-3 text-[13px] text-white placeholder:text-white/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-lime';

function detailList(application, contact) {
  return [
    ['Contact', contact?.full_name || application.display_name || 'Not provided'],
    ['Email', contact?.email || 'Not provided'],
    ['Phone', contact?.phone || 'Not provided'],
    ['Instagram', contact?.instagram ? `@${contact.instagram.replace(/^@/, '')}` : 'Not provided'],
    ['Experience', application.years_experience == null ? 'Not provided' : `${application.years_experience} years`],
    ['Age confirmation', application.age_confirmed ? 'Confirmed' : 'Not confirmed'],
  ];
}

export default function AdminApplications({
  applications,
  contacts,
  isLoading,
  isError,
  isSaving,
  savingId,
  saveError,
  onDecision,
}) {
  const [search, setSearch] = useState('');
  const contactByLensman = useMemo(
    () => new Map(contacts.map((contact) => [contact.lensman_id, contact])),
    [contacts]
  );
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return applications;
    return applications.filter((application) => {
      const contact = contactByLensman.get(application.id);
      return [
        application.display_name,
        contact?.full_name,
        contact?.email,
        contact?.phone,
        contact?.instagram,
      ].some((value) => String(value || '').toLowerCase().includes(term));
    });
  }, [applications, contactByLensman, search]);

  const decide = (application, status) => {
    const action = status === 'approved' ? 'approve' : 'reject';
    const consequence = status === 'approved'
      ? 'The profile will become public and the creator will receive the approval email.'
      : 'The creator will receive the existing decision email.';
    if (window.confirm(`Are you sure you want to ${action} ${application.display_name || 'this creator'}? ${consequence}`)) {
      onDecision(application, status);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3" aria-label="Loading creator applications">
        {[0, 1, 2].map((item) => <div key={item} className="h-40 animate-pulse rounded border border-white/10 bg-white/[0.03]" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label-mono text-[9px] text-neon-cyan">Creator vetting</p>
          <h2 className="mt-2 font-heading text-2xl font-semibold text-white">Pending applications</h2>
          <p className="mt-2 max-w-2xl font-body text-[13px] leading-relaxed text-white/45">
            Review contact details, experience, and portfolio samples before approving a profile.
          </p>
        </div>
        <label className="relative block w-full sm:max-w-[320px]">
          <span className="sr-only">Search applications</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or contact…"
            className={FIELD + ' pl-10'}
          />
        </label>
      </div>

      {isError && (
        <div role="alert" className="border border-neon-magenta/30 bg-neon-magenta/5 p-4 text-[13px] text-white/75">
          Creator applications or contact details could not be loaded. Refresh the page and try again.
        </div>
      )}
      {saveError && (
        <div role="alert" className="border border-neon-magenta/30 bg-neon-magenta/5 p-4 text-[13px] text-white/75">
          The application status could not be updated. Please try again.
        </div>
      )}

      {!isError && filtered.length === 0 ? (
        <div className={CARD + ' p-10 text-center'} style={SURFACE}>
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white/5 text-white/55">
            <UserRound className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="mt-4 font-heading text-lg font-semibold text-white">
            {applications.length ? 'No matching applications' : 'You’re all caught up'}
          </h3>
          <p className="mx-auto mt-2 max-w-md font-body text-[13px] leading-relaxed text-white/45">
            {applications.length
              ? 'Try a different name, email, or phone number.'
              : 'New creator applications will appear here when they are submitted.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((application) => {
            const contact = contactByLensman.get(application.id);
            const name = application.display_name || 'Stelli creator';
            const portfolio = (application.portfolio_images || []).filter(Boolean).slice(0, 3);
            const specialties = (application.specialties || []).filter(Boolean);
            const neighborhoods = (application.neighborhoods || []).filter(Boolean);

            return (
              <article key={application.id} className={CARD + ' overflow-hidden'} style={SURFACE}>
                <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                  <div className="flex min-w-0 items-start gap-4">
                    {application.profile_image ? (
                      <img
                        src={application.profile_image}
                        alt=""
                        loading="lazy"
                        className="h-14 w-14 shrink-0 rounded-full object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/5 text-white/50">
                        <UserRound className="h-5 w-5" aria-hidden="true" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="label-mono text-[8px] text-neon-cyan">Submitted {application.created_date ? new Date(application.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'date unavailable'}</p>
                      <h3 className="mt-2 font-heading text-xl font-semibold leading-tight text-white">{name}</h3>
                      <p className="mt-1 font-body text-[13px] text-white/50">
                        {specialties.length ? specialties.join(' · ') : 'Specialties not provided'}
                      </p>
                      {!!neighborhoods.length && (
                        <p className="mt-1 font-body text-[12px] text-white/40">{neighborhoods.join(' · ')}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[190px]">
                    <Button
                      type="button"
                      onClick={() => decide(application, 'approved')}
                      disabled={isSaving}
                      className="label-mono text-[9px] font-semibold"
                      style={{ background: 'hsl(var(--neon-lime))', color: 'hsl(var(--ink))', borderRadius: 4 }}
                    >
                      {isSaving && savingId === application.id ? 'Approving…' : 'Approve & publish'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => decide(application, 'rejected')}
                      disabled={isSaving}
                      className="label-mono text-[9px] border-white/15 bg-transparent text-white/70 hover:bg-white/5 hover:text-white"
                      style={{ borderRadius: 4 }}
                    >
                      {isSaving && savingId === application.id ? 'Updating…' : 'Reject application'}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-x-8 gap-y-4 border-t border-white/10 px-5 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
                  {detailList(application, contact).map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <p className="label-mono text-[8px] text-white/35">{label}</p>
                      <p className="mt-1 break-words font-body text-[13px] text-white/75">{value}</p>
                    </div>
                  ))}
                </div>

                {application.bio && (
                  <div className="border-t border-white/10 px-5 py-5 sm:px-6">
                    <p className="label-mono text-[8px] text-white/35">About their work</p>
                    <p className="mt-2 max-w-4xl whitespace-pre-line font-body text-[13px] leading-relaxed text-white/70">{application.bio}</p>
                  </div>
                )}

                {portfolio.length > 0 && (
                  <div className="border-t border-white/10 px-5 py-5 sm:px-6">
                    <p className="label-mono text-[8px] text-white/35">Portfolio samples</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:max-w-[520px]">
                      {portfolio.map((src, index) => (
                        <img
                          key={src}
                          src={src}
                          alt={`Portfolio sample ${index + 1} from ${name}`}
                          loading="lazy"
                          decoding="async"
                          className="aspect-[4/3] w-full rounded object-cover"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
