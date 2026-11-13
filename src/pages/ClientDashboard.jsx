import React from 'react';
import { CreditCard, FileSearch, Images, MessageCircle, Sparkles, UserRound, Camera, HelpCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import MyAgreements from '@/components/dashboard/MyAgreements';
import PhotoReleases from '@/components/dashboard/PhotoReleases';
import ShootList from '@/components/dashboard/ShootList';
import PullToRefresh from '@/components/shared/PullToRefresh';
import useClientDashboard from '@/hooks/useClientDashboard';
import useThreads from '@/hooks/useThreads';
import useRequireSignIn from '@/lib/requireSignIn';
import { fullDate, shortDate } from '@/lib/format';
import { Avatar, Btn, Card, EmptyState, ErrorState, Page, Row, Sheet, Skeleton, Stat } from '@/components/system';

/** Each kind of next step gets its own colour block and icon, so the list reads at a glance. */
const STEP_LOOK = {
  pay: { tone: 'lime', icon: CreditCard },
  quote: { tone: 'sky', icon: FileSearch },
  photos: { tone: 'lilac', icon: Images },
};

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function PortalSkeleton() {
  return (
    <Page width="wide">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_380px]" aria-busy="true" aria-label="Loading your portal">
        <div className="space-y-3">
          <Skeleton className="h-[300px] !rounded-st-xl" />
          <Skeleton className="h-[220px] !rounded-st-xl" />
        </div>
        <Skeleton className="h-[420px] !rounded-st-xl" />
      </div>
    </Page>
  );
}

/** The three most recent conversations, with what was said last. */
function MessagesPreview({ threads, unreadCount, isLoading }) {
  const recent = threads.slice(0, 3);
  return (
    <Sheet as="section" aria-labelledby="inbox-title" className="!p-5 sm:!p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 id="inbox-title" className="st-h3">
          Messages {unreadCount > 0 && <span className="st-badge ml-1 align-middle">{unreadCount}</span>}
        </h2>
        <Btn to="/messages" variant="ghost" size="sm">
          See all
        </Btn>
      </div>
      <div className="mt-3">
        {isLoading ? (
          <Skeleton className="h-[150px] !rounded-st-md" />
        ) : recent.length ? (
          <div className="st-list">
            {recent.map((thread) => (
              <Row
                key={thread.booking.id}
                to={`/messages/${thread.booking.id}`}
                leading={<Avatar src={thread.otherPhoto} name={thread.otherName} />}
                title={
                  <>
                    {thread.otherName || 'Conversation'}
                    {thread.unread && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-[var(--st-primary)] align-middle" aria-label="unread" />}
                  </>
                }
                meta={thread.latest?.content ? `${thread.latestIsMine ? 'You: ' : ''}${thread.latest.content}` : 'No messages yet'}
              />
            ))}
          </div>
        ) : (
          <p className="st-small rounded-st-md bg-fill px-4 py-5 text-center">Conversations with creators show up here.</p>
        )}
      </div>
    </Sheet>
  );
}

/**
 * The client portal: what needs you, your shoots, your inbox, and everything
 * else you have on record. One screen; on a phone it stacks in that order.
 */
export default function ClientDashboard() {
  const { user, userLoading, bookings, active, past, steps, isLoading, isError, retry, hasCreatorProfile } = useClientDashboard();
  const { threads, unreadCount, isLoading: threadsLoading } = useThreads();
  const queryClient = useQueryClient();
  // Signed out: go and log in, then come straight back here.
  const waiting = useRequireSignIn(user, userLoading);

  // A pull at the top reloads the portal and the inbox together.
  const refreshAll = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['client-bookings'] }),
      queryClient.invalidateQueries({ queryKey: ['client-quotes'] }),
      queryClient.invalidateQueries({ queryKey: ['messages-inbox'] }),
      queryClient.invalidateQueries({ queryKey: ['photo-releases'] }),
    ]);

  if (waiting) return <PortalSkeleton />;

  const firstName = (user?.profile_name || user?.full_name || '').trim().split(' ')[0] || 'there';
  const delivered = bookings.filter((b) => b.delivered_at && ['delivered', 'completed'].includes(b.status)).length;

  // The real next step on each booking that has one: a quote to answer, a
  // payment to make, photos to look at.
  const needs = steps.map((step) => {
    const booking = bookings.find((b) => b.id === step.bookingId);
    return {
      ...step,
      meta: [shortDate(booking?.event_date), booking?.location].filter(Boolean).join(' · '),
    };
  });

  const summary = isError
    ? "We couldn't load your shoots just now."
    : isLoading
      ? 'Getting your shoots…'
      : needs.length
        ? `${plural(needs.length, 'thing')} ${needs.length === 1 ? 'needs' : 'need'} you today.`
        : active.length
          ? "You're all caught up. Your creators have the next move."
          : 'Book your first shoot and it all lands here.';

  return (
    <PullToRefresh onRefresh={refreshAll}>
      <Page width="wide">
        <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-3">
            {/* The greeting: one sentence on where things stand, and the numbers behind it. */}
            <Sheet className="st-aurora st-aurora--dusk st-rise">
              <p className="st-kicker">{fullDate(new Date())}</p>
              <h1 className="st-display mt-3">
                Hey, <span className="st-serif">{firstName}.</span>
              </h1>
              <p className="st-lede mt-3 !text-[17px]">{summary}</p>

              <div className="mt-7 grid max-w-[520px] grid-cols-3 gap-3">
                <Stat value={isLoading || isError ? '–' : active.length} label="Active shoots" />
                <Stat value={isLoading || isError ? '–' : needs.length} label="Waiting on you" />
                <Stat value={threadsLoading ? '–' : unreadCount} label="Unread messages" />
              </div>

              <div className="mt-7 flex flex-wrap gap-2.5">
                <Btn to="/creators" variant="ink" arrow="end">
                  Find a creator
                </Btn>
                <Btn to="/messages" variant="outline" className="!bg-white/50">
                  <MessageCircle aria-hidden /> Messages
                </Btn>
              </div>
            </Sheet>

            {/* To do: each card is one decision, one tap. */}
            <Sheet as="section" aria-labelledby="todo-title">
              <div className="flex items-baseline justify-between gap-3">
                <h2 id="todo-title" className="st-h2">To do</h2>
                {needs.length > 0 && <span className="st-small">{plural(needs.length, 'item')}</span>}
              </div>

              <div className="mt-4">
                {isError ? (
                  <ErrorState title="Your to-do list didn't load." onRetry={retry} className="st-card" />
                ) : isLoading ? (
                  <Skeleton className="h-[88px] !rounded-st-md" />
                ) : needs.length ? (
                  <ul className="grid gap-2.5 sm:grid-cols-2">
                    {needs.map((item, i) => {
                      const look = STEP_LOOK[item.key] || { tone: 'sky', icon: Sparkles };
                      const Icon = look.icon;
                      return (
                        <li key={item.id} className="st-rise" style={/** @type {React.CSSProperties} */ ({ '--i': i })}>
                          <Card tone={look.tone} hover className="flex h-full flex-col">
                            <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-white" aria-hidden>
                              <Icon className="h-[18px] w-[18px]" />
                            </span>
                            <p className="mt-4 text-[17px] font-extrabold leading-snug tracking-[-0.025em]">{item.title}</p>
                            {item.meta && <p className="mt-1 text-[13.5px] text-fg-2">{item.meta}</p>}
                            <Btn to={item.to} variant="ink" size="sm" arrow="end" className="mt-4 self-start">
                              {item.action}
                            </Btn>
                          </Card>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="st-card st-card--soft">
                    <EmptyState
                      icon={Sparkles}
                      title="You're all caught up."
                      body={active.length ? 'Nothing is waiting on you. We’ll put it here the moment something is.' : 'Book your next shoot and every step shows up here.'}
                      action={!active.length && <Btn to="/creators" size="sm" arrow="end">Find a creator</Btn>}
                    />
                  </div>
                )}
              </div>
            </Sheet>

            <Sheet>
              <ShootList
                role="client"
                active={active}
                past={past}
                isLoading={isLoading}
                isError={isError}
                onRetry={retry}
                emptyText="Shoots you request will show up here."
              />
            </Sheet>
          </div>

          <aside className="min-w-0 space-y-3 lg:sticky lg:top-24" aria-label="More in your portal">
            <MessagesPreview threads={threads} unreadCount={unreadCount} isLoading={threadsLoading} />

            <Sheet className="!p-5 sm:!p-6 space-y-6 empty:hidden">
              <PhotoReleases role="client" user={user} title="Share your shoots" />
              <MyAgreements role="client" />
              <section aria-label="Shortcuts">
                <h2 className="st-kicker mb-2.5 px-1">Shortcuts</h2>
                <div className="st-list">
                  <Row
                    to="/account-settings"
                    leading={<span className="st-avatar !bg-tint-sky !text-[var(--tint-sky-ink)]"><UserRound className="h-[18px] w-[18px]" /></span>}
                    title="Account"
                    meta={user?.email}
                  />
                  {hasCreatorProfile && (
                    <Row
                      to="/lensman-dashboard"
                      leading={<span className="st-avatar !bg-tint-lime !text-[var(--tint-lime-ink)]"><Camera className="h-[18px] w-[18px]" /></span>}
                      title="Creator workspace"
                      meta="Your requests, shoots and payouts"
                    />
                  )}
                  <Row
                    to="/faq"
                    leading={<span className="st-avatar !bg-tint-butter !text-[var(--tint-butter-ink)]"><HelpCircle className="h-[18px] w-[18px]" /></span>}
                    title="Questions"
                    meta="How booking, payment and delivery work"
                  />
                </div>
              </section>
              {delivered > 0 && <p className="st-small px-1">{plural(delivered, 'album')} delivered so far.</p>}
            </Sheet>
          </aside>
        </div>
      </Page>
    </PullToRefresh>
  );
}
