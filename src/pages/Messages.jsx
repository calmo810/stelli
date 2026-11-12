import React from 'react';
import { useParams } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import useThreads from '@/hooks/useThreads';
import ConversationList from '@/components/thread/ConversationList';
import ChatView from '@/components/thread/ChatView';
import useRequireSignIn from '@/lib/requireSignIn';

/**
 * Messages. On a computer: your conversations on the left, the open chat on the right.
 * On a phone: the list is one page, and tapping a conversation opens the chat as its own page.
 */
export default function Messages() {
  const { bookingId } = useParams();
  const { user, userLoading, threads, unreadCount, isLoading, refetch } = useThreads();
  // Signed out: log in, then come straight back to this conversation.
  const waiting = useRequireSignIn(user, userLoading);
  if (waiting) return <div className="chat-screen" aria-busy="true" />;

  return (
    <div className="mx-auto flex chat-screen w-full max-w-[1320px] px-2 pb-2 pt-2 sm:px-4 lg:h-[calc(100dvh-4rem)] lg:px-8 lg:py-5">
      <div className="st-paper flex min-h-0 w-full overflow-hidden rounded-st-lg bg-white shadow-st-float lg:rounded-st-xl">
        <aside
          className={`min-h-0 w-full shrink-0 border-line lg:flex lg:w-[380px] lg:border-r ${
            bookingId ? 'hidden' : 'flex'
          }`}
        >
          <div className="min-h-0 w-full">
            <ConversationList
              threads={threads}
              activeId={bookingId}
              isLoading={isLoading}
              unreadCount={unreadCount}
              onRefresh={refetch}
            />
          </div>
        </aside>

        <section className={`min-h-0 min-w-0 flex-1 lg:flex ${bookingId ? 'flex' : 'hidden'}`}>
          <div className="min-h-0 w-full">
            {bookingId ? (
              <ChatView key={bookingId} bookingId={bookingId} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <span className="st-empty__icon" aria-hidden><MessageCircle /></span>
                <p className="st-empty__title">Pick a conversation</p>
                <p className="st-empty__body">Your messages open here.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}