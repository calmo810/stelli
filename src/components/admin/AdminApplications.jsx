import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Check,
  CheckCircle2,
  ChevronRight,
  ImageIcon,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
  XCircle,
} from 'lucide-react';

const FIELD = 'w-full rounded-2xl border border-white/12 bg-black/15 px-4 py-3 text-[13px] text-white placeholder:text-white/35 transition focus:border-neon-cyan/60 focus:outline-none focus:ring-2 focus:ring-neon-cyan/15';

function formattedDate(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function DetailRow({ icon: Icon, label, value, href }) {
  const content = href ? (
    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} className="break-words text-white/78 transition hover:text-neon-cyan">
      {value}
    </a>
  ) : (
    <span className="break-words text-white/78">{value}</span>
  );

  return (
    <div className="flex min-w-0 gap-3 rounded-2xl border border-white/[0.07] bg-black/10 px-3.5 py-3">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[0.055] text-white/50">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="label-mono text-[8px] text-white/35">{label}</p>
        <p className="mt-1 font-body text-[13px]">{content}</p>
      </div>
    </div>
  );
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
  const [decisionIntent, setDecisionIntent] = useState(null);
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
        ...(application.specialties || []),
        ...(application.neighborhoods || []),
      ].some((value) => String(value || '').toLowerCase().includes(term));
    });
  }, [applications, contactByLensman, search]);

  const requestDecision = (application, status) => {
    setDecisionIntent({ applicationId: application.id, status });
  };

  const confirmDecision = (application) => {
    if (!decisionIntent) return;
    onDecision(application, decisionIntent.status);
  };

  if (isLoading) {
    return (
      <div className="space-y-4" aria-label="Loading creator applications">
        {[0, 1, 2].map((item) => <div key={item} className="h-64 animate-pulse rounded-[24px] border border-white/10 bg-white/[0.035]" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="admin-surface p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="admin-kicker label-mono text-[8px]"><Sparkles className="h-3 w-3" aria-hidden="true" /> Review queue</p>
            <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-white">Creator applications</h2>
            <p className="mt-2 max-w-xl font-body text-[13px] leading-relaxed text-white/48">
              Review the person, their work, and the fit—then make one clear decision.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="inline-flex h-[46px] items-center justify-center gap-2 rounded-2xl border border-neon-cyan/20 bg-neon-cyan/[0.08] px-4 text-[12px] font-semibold text-neon-cyan">
              <span className="admin-status-dot" aria-hidden="true" />
              {filtered.length} to review
            </span>
            <label className="relative block w-full sm:w-[270px]">
              <span className="sr-only">Search applications</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search people or specialties…"
                className={FIELD + ' pl-11'}
              />
            </label>
          </div>
        </div>

        <div className="mt-5 grid gap-3 border-t border-white/[0.08] pt-5 sm:grid-cols-3">
          {[
            ['01', 'Profile', 'Contact, experience, and location'],
            ['02', 'Portfolio', 'A quick look at their work'],
            ['03', 'Decision', 'Approve or decline with confidence'],
          ].map(([number, title, detail]) => (
            <div key={number} className="flex items-center gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/[0.055] label-mono text-[8px] text-white/55">{number}</span>
              <div>
                <p className="text-[12px] font-semibold text-white/78">{title}</p>
                <p className="mt-0.5 text-[11px] text-white/35">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {isError && (
        <div role="alert" className="rounded-2xl border border-neon-magenta/30 bg-neon-magenta/5 p-4 text-[13px] text-white/75">
          Creator applications or contact details could not be loaded. Refresh the page and try again.
        </div>
      )}
      {saveError && (
        <div role="alert" className="rounded-2xl border border-neon-magenta/30 bg-neon-magenta/5 p-4 text-[13px] text-white/75">
          The application status could not be updated. Please try again.
        </div>
      )}

      {!isError && filtered.length === 0 ? (
        <div className="admin-surface p-12 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-neon-lime/10 text-neon-lime">
            <UserRound className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="mt-5 font-heading text-xl font-semibold text-white">
            {applications.length ? 'No matching applications' : 'You’re all caught up'}
          </h3>
          <p className="mx-auto mt-2 max-w-md font-body text-[13px] leading-relaxed text-white/45">
            {applications.length
              ? 'Try a different name, specialty, email, or phone number.'
              : 'New creator applications will appear here when they are submitted.'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map((application) => {
            const contact = contactByLensman.get(application.id);
            const name = application.display_name || 'Stelli creator';
            const portfolio = (application.portfolio_images || []).filter(Boolean).slice(0, 3);
            const specialties = (application.specialties || []).filter(Boolean);
            const neighborhoods = (application.neighborhoods || []).filter(Boolean);
            const isConfirming = decisionIntent?.applicationId === application.id;
            const isApproving = decisionIntent?.status === 'approved';
            const isThisSaving = isSaving && savingId === application.id;
            const instagram = contact?.instagram?.replace(/^@/, '');

            return (
              <article key={application.id} className="admin-surface overflow-hidden">
                <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_260px]">
                  <div className="min-w-0">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                      {application.profile_image ? (
                        <img
                          src={application.profile_image}
                          alt=""
                          loading="lazy"
                          className="h-16 w-16 shrink-0 rounded-[22px] object-cover ring-1 ring-white/12"
                        />
                      ) : (
                        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[22px] bg-white/[0.055] text-white/45">
                          <UserRound className="h-6 w-6" aria-hidden="true" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="label-mono rounded-full border border-neon-cyan/20 bg-neon-cyan/[0.08] px-2.5 py-1 text-[8px] text-neon-cyan">Pending review</span>
                          <span className="label-mono text-[8px] text-white/35">Submitted {formattedDate(application.created_date)}</span>
                        </div>
                        <h3 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-white">{name}</h3>
                        <p className="mt-2 font-body text-[13px] text-white/55">
                          {specialties.length ? specialties.join(' · ') : 'Specialties not provided'}
                        </p>
                        {!!neighborhoods.length && (
                          <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-white/42">
                            <MapPin className="h-3.5 w-3.5 text-neon-cyan" aria-hidden="true" />
                            {neighborhoods.join(' · ')}
                          </p>
                        )}
                      </div>
                    </div>

                    {application.bio && (
                      <div className="mt-6 rounded-2xl border border-white/[0.07] bg-black/10 p-4">
                        <p className="label-mono text-[8px] text-white/35">About their work</p>
                        <p className="mt-2 whitespace-pre-line font-body text-[13px] leading-relaxed text-white/68">{application.bio}</p>
                      </div>
                    )}
                  </div>

                  <aside className="rounded-[20px] border border-white/[0.10] bg-black/15 p-4">
                    {isConfirming ? (
                      <div className="flex h-full flex-col">
                        <span className={"grid h-9 w-9 place-items-center rounded-xl " + (isApproving ? 'bg-neon-lime/15 text-neon-lime' : 'bg-neon-magenta/15 text-neon-magenta')}>
                          {isApproving ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <XCircle className="h-4 w-4" aria-hidden="true" />}
                        </span>
                        <h4 className="mt-4 text-[14px] font-semibold text-white">
                          {isApproving ? 'Publish this creator?' : 'Decline this application?'}
                        </h4>
                        <p className="mt-2 text-[12px] leading-relaxed text-white/45">
                          {isApproving
                            ? 'Their profile will go live and the approval email will be sent.'
                            : 'Their profile stays private and the decision email will be sent.'}
                        </p>
                        <div className="mt-5 grid gap-2">
                          <Button
                            type="button"
                            onClick={() => confirmDecision(application)}
                            disabled={isSaving}
                            className={isApproving
                              ? 'h-10 rounded-xl bg-neon-lime text-[10px] font-semibold uppercase tracking-[0.13em] text-ink hover:bg-neon-lime/90'
                              : 'h-10 rounded-xl bg-neon-magenta text-[10px] font-semibold uppercase tracking-[0.13em] text-ink hover:bg-neon-magenta/90'}
                          >
                            {isThisSaving ? 'Saving…' : isApproving ? 'Confirm approval' : 'Confirm rejection'}
                          </Button>
                          <button
                            type="button"
                            onClick={() => setDecisionIntent(null)}
                            disabled={isSaving}
                            className="h-9 rounded-xl text-[11px] font-medium text-white/50 transition hover:bg-white/5 hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-full flex-col">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-neon-lime/12 text-neon-lime">
                          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <p className="mt-4 label-mono text-[8px] text-white/38">Decision</p>
                        <h4 className="mt-2 text-[14px] font-semibold text-white">Ready to review</h4>
                        <p className="mt-2 text-[12px] leading-relaxed text-white/45">Approve to publish their profile, or decline to keep it private.</p>
                        <div className="mt-auto grid gap-2 pt-5">
                          <Button
                            type="button"
                            onClick={() => requestDecision(application, 'approved')}
                            disabled={isSaving}
                            className="h-10 rounded-xl bg-neon-lime text-[10px] font-semibold uppercase tracking-[0.13em] text-ink hover:bg-neon-lime/90"
                          >
                            <Check className="h-3.5 w-3.5" /> Approve & publish
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => requestDecision(application, 'rejected')}
                            disabled={isSaving}
                            className="h-10 rounded-xl border-white/12 bg-transparent text-[10px] font-semibold uppercase tracking-[0.13em] text-white/62 hover:border-neon-magenta/50 hover:bg-neon-magenta/10 hover:text-white"
                          >
                            <X className="h-3.5 w-3.5" /> Decline
                          </Button>
                        </div>
                      </div>
                    )}
                  </aside>
                </div>

                <div className="grid gap-3 border-t border-white/[0.08] px-5 py-5 sm:grid-cols-2 sm:px-6 xl:grid-cols-3">
                  <DetailRow icon={UserRound} label="Contact" value={contact?.full_name || name} />
                  <DetailRow icon={Mail} label="Email" value={contact?.email || 'Not provided'} href={contact?.email ? 'mailto:' + contact.email : undefined} />
                  <DetailRow icon={Phone} label="Phone" value={contact?.phone || 'Not provided'} href={contact?.phone ? 'tel:' + contact.phone : undefined} />
                  <DetailRow icon={Instagram} label="Instagram" value={instagram ? '@' + instagram : 'Not provided'} href={instagram ? 'https://instagram.com/' + instagram : undefined} />
                  <DetailRow icon={Sparkles} label="Experience" value={application.years_experience == null ? 'Not provided' : application.years_experience + ' years'} />
                  <DetailRow icon={ShieldCheck} label="Age confirmation" value={application.age_confirmed ? 'Confirmed' : 'Not confirmed'} />
                </div>

                {portfolio.length > 0 && (
                  <div className="border-t border-white/[0.08] px-5 py-5 sm:px-6">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="label-mono text-[8px] text-white/35">Portfolio samples</p>
                        <p className="mt-1 text-[12px] text-white/45">A quick read on their visual point of view.</p>
                      </div>
                      <span className="inline-flex items-center gap-2 text-[11px] text-white/35"><ImageIcon className="h-3.5 w-3.5" aria-hidden="true" /> {portfolio.length} sample{portfolio.length === 1 ? '' : 's'}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {portfolio.map((src, index) => (
                        <figure key={src} className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-black/20">
                          <img
                            src={src}
                            alt={'Portfolio sample ' + (index + 1) + ' from ' + name}
                            loading="lazy"
                            decoding="async"
                            className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                          />
                          <figcaption className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 label-mono text-[8px] text-white/75">0{index + 1}</figcaption>
                        </figure>
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
